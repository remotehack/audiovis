import FFT from "fft.js";
import { useAudioCtx } from "./AudioCtxCtx";
import { useEffect, useState } from "react";
import colormap from "colormap";
import DynamicTimeWarping from "dynamic-time-warping-ts";

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

export const calculateSimilarity = (
  specA: Float32Array,
  specB: Float32Array,
  stride: number
) => {
  const aLen = specA.length / stride; // Number of segments in specA
  const bLen = specB.length / stride; // Number of segments in specB
  const sim = new Float32Array(aLen * bLen);

  // console.log({ aLen, bLen });

  for (let i = 0; i < aLen; i++) {
    for (let j = 0; j < bLen; j++) {
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      // Compute dot product and norms for segment i and j
      for (let k = 0; k < stride; k++) {
        const aVal = specA[i * stride + k];
        const bVal = specB[j * stride + k];
        dotProduct += aVal * bVal;
        normA += aVal * aVal;
        normB += bVal * bVal;
      }

      // Safeguard against zero or near-zero norms
      const denom = Math.sqrt(normA) * Math.sqrt(normB);
      sim[i * bLen + j] = denom > 0 ? dotProduct / denom : 0;
    }
  }

  return sim;
};

export const calculateDTW = (
  specA: Float32Array,
  specB: Float32Array,
  stride: number
) => {
  const aParts = subarrays(specA, stride);
  const bParts = subarrays(specB, stride);

  console.log({ aParts, bParts });

  function distFunc(a: Float32Array, b: Float32Array) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    // Compute dot product and norms for segment i and j
    for (let k = 0; k < a.length; k++) {
      const aVal = a[k];
      const bVal = b[k];
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    // Safeguard against zero or near-zero norms
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return 1 - (denom > 0 ? dotProduct / denom : 0);
  }

  const dtw = new DynamicTimeWarping(aParts, bParts, distFunc);

  return dtw.getPath();

  // return sim;
};

function subarrays(source: Float32Array, stride: number): Float32Array[] {
  if (source.length % stride !== 0) throw new Error("invalid length");

  const result: Float32Array[] = [];
  for (let i = 0; i < source.length; i += stride) {
    result.push(source.subarray(i, i + stride));
  }

  return result;
}
