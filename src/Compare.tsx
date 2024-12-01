import { FC, useEffect, useMemo, useRef } from "react";
import {
  calculateSimilarity,
  spectrum,
  spectrumToImage,
  useAudioBuffer,
  valueToColor,
  calculateDTW,
} from "./util";
import styles from "./Compare.module.css";

export const Compare: FC<{ a: Blob; b: Blob }> = ({ a, b }) => {
  const bufA = useAudioBuffer(a);
  const bufB = useAudioBuffer(b);

  const specA = useMemo(() => (bufA ? spectrum(bufA, 512) : null), [bufA]);
  const specB = useMemo(() => (bufB ? spectrum(bufB, 512) : null), [bufB]);

  // similiarity

  const similarity = useMemo(() => {
    if (specA && specB) {
      const sim = calculateSimilarity(specA, specB, 512);

      return sim;
    }

    return null;
  }, [specA, specB]);

  const dtw = useMemo(() => {
    if (specA && specB) {
      const dtw = calculateDTW(specA, specB, 512);

      console.log({ dtw });
      return dtw;
    }
  }, [specA, specB]);

  if (specA && specB && similarity && dtw) {
    return (
      <div className={styles.container}>
        <Waveform spec={specA} rotate />
        <Correlation
          similarity={similarity}
          width={specB.length / 512}
          dtw={dtw}
        />
        <Waveform spec={specB} />
      </div>
    );
  }

  return <h1>Compare</h1>;
};

const Waveform: FC<{ spec: Float32Array; rotate?: true }> = ({
  spec,
  rotate,
}) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  const imData = useMemo(() => spectrumToImage(spec, 512), [spec]);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) {
      const im = rotate ? rotateImageData90(imData) : imData;

      ctx.canvas.width = im.width;
      ctx.canvas.height = im.height;

      ctx.putImageData(im, 0, 0);
    }
  }, [imData, rotate]);

  return <canvas ref={canvas} />;
};

const Correlation: FC<{
  similarity: Float32Array;
  width: number;
  dtw: [number, number][];
}> = ({ similarity, width, dtw }) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) {
      const height = similarity.length / width;
      const imData = new ImageData(width, height);

      for (let i = 0; i < similarity.length; i++) {
        const element = similarity[i];

        const [r, g, b, a] = valueToColor(element);

        imData.data[i * 4] = r * 255;
        imData.data[i * 4 + 1] = g * 255;
        imData.data[i * 4 + 2] = b * 255;
        imData.data[i * 4 + 3] = a * 255;
      }

      ctx.canvas.width = imData.width;
      ctx.canvas.height = imData.height;

      ctx.putImageData(imData, 0, 0);

      ctx.beginPath();
      for (const [x, y] of dtw) {
        ctx.lineTo(y, x);
      }

      ctx.strokeStyle = "#f08";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  }, [similarity, dtw, width]);

  return <canvas ref={canvas} />;
};

function rotateImageData90(imageData: ImageData) {
  const { width, height, data } = imageData;
  // Create a new ImageData object with swapped dimensions
  const rotatedImageData = new ImageData(height, width);

  const rotatedData = rotatedImageData.data;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Calculate the source pixel index
      const srcIndex = (y * width + x) * 4;

      // Calculate the destination pixel index
      // Transpose the coordinates and reverse the Y-axis
      const dstIndex = (x * height + (height - y - 1)) * 4;

      // Copy the RGBA values
      rotatedData[dstIndex] = data[srcIndex]; // R
      rotatedData[dstIndex + 1] = data[srcIndex + 1]; // G
      rotatedData[dstIndex + 2] = data[srcIndex + 2]; // B
      rotatedData[dstIndex + 3] = data[srcIndex + 3]; // A
    }
  }

  return rotatedImageData;
}
