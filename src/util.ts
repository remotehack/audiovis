import FFT from "fft.js";
import { useAudioCtx } from "./AudioCtxCtx";
import { useEffect, useState } from "react";

/**  load the spectrum for an entire audio buffer*/
export function spectrum(
  audio: AudioBuffer,
  fftSize: 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096
): Float32Array {
  const fft = new FFT(fftSize);
  const data = audio.getChannelData(0);

  const chunks = Math.floor(audio.length / fftSize);
  const target = new Float32Array(fftSize * chunks);

  const sample = new Array(fftSize);
  const out = fft.createComplexArray();

  for (let i = 0; i < chunks; i++) {
    const offset = i * fftSize;
    for (let i = 0; i < sample.length; i++) sample[i] = data[i + offset];
    fft.realTransform(out, sample);

    for (let j = 0; j < fftSize; j++) {
      target[i * fftSize + j] = Math.abs(out[j]);
    }
  }

  return target;
}

/** Render a spectrum as a visible image to be written to canvas */
export function spectrumToImage(
  spectrum: Float32Array,
  fftSize: 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096
) {
  const chunks = spectrum.length / fftSize;

  const image = new ImageData(chunks, fftSize);

  const max = spectrum.reduce((a, b) => Math.max(a, b), -Infinity);

  for (let i = 0; i < chunks; i++) {
    for (let j = 0; j < fftSize; j++) {
      const idx = j * chunks + i;
      const value = spectrum[i * fftSize + j];

      const scaledValue = Math.pow(value / max, 0.3); // Apply a power scale

      const [r, g, b, a] = valueToColor(scaledValue);

      image.data[idx * 4] = r;
      image.data[idx * 4 + 1] = g;
      image.data[idx * 4 + 2] = b;
      image.data[idx * 4 + 3] = a;
    }
  }

  return image;
}

export function useAudioBuffer(src: Blob) {
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

export function valueToColor(value: number) {
  const r = value < 0.5 ? 0 : 255 * (value - 0.5) * 2;
  const g = value < 0.5 ? 255 * value * 2 : 255 * (1 - value) * 2;
  const b = value < 0.5 ? 255 * (1 - value * 2) : 0;
  const a = value > 0.2 ? 255 : value * 5 * 255;
  return [r, g, b, a];
}
