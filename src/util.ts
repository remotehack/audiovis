import FFT from "fft.js";
import { useAudioCtx } from "./AudioCtxCtx";
import { useEffect, useState } from "react";
import colormap from "colormap";

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

      image.data[idx * 4] = r * 255;
      image.data[idx * 4 + 1] = g * 255;
      image.data[idx * 4 + 2] = b * 255;
      image.data[idx * 4 + 3] = a * 255;
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

const colors = colormap({
  // colormap: "viridis",
  colormap: "jet",
  nshades: 255,
  format: "float",
});
console.log(colors);

export function valueToColor(value: number) {
  const idx = Math.floor(value * colors.length);

  return colors[idx] || [0xff, 0, 0x8, 255];
}
