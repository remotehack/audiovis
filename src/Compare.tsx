import { FC, useEffect, useMemo, useRef } from "react";
import {
  spectrum,
  spectrumToImage,
  useAudioBuffer,
  valueToColor,
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
      const aLen = specA.length / 512;
      const bLen = specB.length / 512;

      const sim = new Float32Array(aLen * bLen);

      for (let i = 0; i < aLen; i++) {
        for (let j = 0; j < bLen; j++) {
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;
          for (let k = 0; k < 512; k++) {
            const aVal = specA[i * 512 + k];
            const bVal = specB[j * 512 + k];
            dotProduct += aVal * bVal;
            normA += aVal * aVal;
            normB += bVal * bVal;
          }
          sim[i * bLen + j] =
            dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        }
      }

      console.log(sim);

      return sim;
    }

    return null;
  }, [specA, specB]);

  if (specA && specB && similarity) {
    return (
      <div className={styles.container}>
        <Foobar spec={specA} rotate />
        <Baz similarity={similarity} width={specA.length / 512} />
        <Foobar spec={specB} />
      </div>
    );
  }

  return <h1>Compare</h1>;
};

const Foobar: FC<{ spec: Float32Array; rotate?: true }> = ({
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

const Baz: FC<{ similarity: Float32Array; width: number }> = ({
  similarity,
  width,
}) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) {
      const height = similarity.length / width;
      const imData = new ImageData(width, height);

      for (let i = 0; i < similarity.length; i++) {
        const element = similarity[i];

        const [r, g, b, a] = valueToColor(element);

        imData.data[i * 4] = r;
        imData.data[i * 4 + 1] = g;
        imData.data[i * 4 + 2] = b;
        imData.data[i * 4 + 3] = a;
      }

      ctx.canvas.width = imData.width;
      ctx.canvas.height = imData.height;

      ctx.putImageData(imData, 0, 0);
    }
  }, [similarity]);

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
