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
    const fftSize = 1024; // Ensure this is a power of two
    const fft = new FFT(fftSize);
    const data = audio.getChannelData(0);

    const chunks = Math.floor(audio.length / fftSize);
    const target = new Float32Array(fftSize * chunks);

    const truncatedData = new Array(fftSize);
    const out = fft.createComplexArray();

    let min = Infinity;
    let max = -Infinity;

    for (let i = 0; i < chunks; i++) {
      const offset = i * fftSize;
      for (let i = 0; i < truncatedData.length; i++)
        truncatedData[i] = data[i + offset];
      fft.realTransform(out, truncatedData);

      for (let j = 0; j < fftSize; j++) {
        target[i * fftSize + j] = out[j];
        max = Math.max(max, target[i * fftSize + j]);
        min = Math.min(min, target[i * fftSize + j]);
      }
    }

    const image = new ImageData(chunks, fftSize);

    for (let i = 0; i < chunks; i++) {
      for (let j = 0; j < fftSize; j++) {
        const idx = j * chunks + i;
        const value = Math.abs(target[i * fftSize + j]);

        const scaledValue = value * 0.1;

        const clamped = Math.max(Math.min(scaledValue, 1), 0);

        const col = hslToRgb(clamped / 2, 0.9, 0.5);

        image.data[idx * 4] = col[0];
        image.data[idx * 4 + 1] = col[1];
        image.data[idx * 4 + 2] = col[2];
        image.data[idx * 4 + 3] = clamped * 255;
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

function hslToRgb(h: number, s: number, l: number) {
  let r: number, g: number, b: number;

  if (s == 0) {
    r = g = b = l; // achromatic
  } else {
    function hue2rgb(p: number, q: number, t: number) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}
