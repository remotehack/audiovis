import { FC, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Audiovis.module.css";
import { useAudioCtx } from "./AudioCtxCtx";
import FFT from "fft.js";

export const Audiovis: FC<{ srcObject: Blob }> = ({ srcObject }) => {
  const url = useMemo(() => URL.createObjectURL(srcObject), [srcObject]);
  const buffer = useAudioBuffer(srcObject);

  return (
    <section className={styles.container}>
      <audio src={url} controls />

      {buffer && <Waveform audio={buffer} />}
      {buffer && <Sonogram audio={buffer} />}
    </section>
  );
};

function useAudioBuffer(src: Blob) {
  const audioCtx = useAudioCtx();
  const [buffer, setBuffer] = useState<AudioBuffer>();

  useEffect(() => {
    if (audioCtx) {
      src
        .arrayBuffer()
        .then((bytes) => audioCtx.decodeAudioData(bytes))
        .then(setBuffer);
    }
  }, [audioCtx, src]);

  return buffer;
}

const Waveform: FC<{ audio: AudioBuffer }> = ({ audio }) => {
  const width = 800;
  const height = 100;
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, width, height);

      const data = audio.getChannelData(0);

      ctx.beginPath();
      ctx.strokeStyle = "#fff";
      for (let i = 0; i < data.length; i++) {
        const x = (i / data.length) * width;
        const y = ((data[i] + 1) / 2) * height;

        ctx.lineTo(x, y);
      }

      ctx.stroke();
    }
  }, [audio]);

  return (
    <canvas
      ref={canvas}
      width={width}
      height={height}
      className={styles.waveform}
    />
  );
};

const Sonogram: FC<{ audio: AudioBuffer }> = ({ audio }) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  const fttData = useMemo(() => {
    const fftSize = 512; // Ensure this is a power of two
    const fft = new FFT(fftSize);
    const data = audio.getChannelData(0);

    const chunks = Math.floor(audio.length / fftSize);
    const target = new Float32Array(fftSize * chunks);

    const sample = new Array(fftSize);
    const out = fft.createComplexArray();

    let max = -Infinity;

    for (let i = 0; i < chunks; i++) {
      const offset = i * fftSize;
      for (let i = 0; i < sample.length; i++) sample[i] = data[i + offset];
      fft.realTransform(out, sample);

      for (let j = 0; j < fftSize; j++) {
        target[i * fftSize + j] = Math.abs(out[j]);
        max = Math.max(max, target[i * fftSize + j]);
      }
    }

    max = max / 4;

    const image = new ImageData(chunks, fftSize);

    for (let i = 0; i < chunks; i++) {
      for (let j = 0; j < fftSize; j++) {
        const idx = j * chunks + i;
        const value = target[i * fftSize + j];

        const scaledValue = Math.pow(value / max, 0.3); // Apply a power scale

        const [r, g, b, a] = valueToColor(scaledValue);

        image.data[idx * 4] = r;
        image.data[idx * 4 + 1] = g;
        image.data[idx * 4 + 2] = b;
        image.data[idx * 4 + 3] = a;
      }
    }

    return image;
  }, [audio]);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) {
      ctx.canvas.width = fttData.width;
      ctx.canvas.height = fttData.height;

      ctx.putImageData(fttData, 0, 0);
    }
  }, [fttData]);

  return <canvas ref={canvas} className={styles.waveform} />;
};

function valueToColor(value: number) {
  const r = value < 0.5 ? 0 : 255 * (value - 0.5) * 2;
  const g = value < 0.5 ? 255 * value * 2 : 255 * (1 - value) * 2;
  const b = value < 0.5 ? 255 * (1 - value * 2) : 0;
  const a = value > 0.2 ? 255 : value * 5 * 255;
  return [r, g, b, a];
}
