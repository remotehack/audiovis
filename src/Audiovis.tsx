import { FC, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Audiovis.module.css";
import { useAudioCtx } from "./AudioCtxCtx";
import { spectrum, spectrumToImage } from "./util";

export const Audiovis: FC<{
  srcObject: Blob;
  picked: boolean;
  onPick: () => void;
}> = ({ srcObject, picked, onPick }) => {
  const url = useMemo(() => URL.createObjectURL(srcObject), [srcObject]);
  const buffer = useAudioBuffer(srcObject);

  return (
    <section
      className={classes(styles.container, picked && styles.picked)}
      onClick={onPick}
    >
      <audio src={url} controls />

      {buffer && <Waveform audio={buffer} />}
      {buffer && <Spectrogram audio={buffer} />}
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

const Spectrogram: FC<{ audio: AudioBuffer }> = ({ audio }) => {
  const canvas = useRef<HTMLCanvasElement>(null);

  const imageData = useMemo(() => {
    const fftSize = 512;
    const data = spectrum(audio, fftSize);
    const image = spectrumToImage(data, fftSize);

    return image;
  }, [audio]);

  useEffect(() => {
    const ctx = canvas.current?.getContext("2d");
    if (ctx) {
      ctx.canvas.width = imageData.width;
      ctx.canvas.height = imageData.height;

      ctx.putImageData(imageData, 0, 0);
    }
  }, [imageData]);

  return <canvas ref={canvas} className={styles.waveform} />;
};

function classes(...list: (string | false)[]) {
  return list.filter(Boolean).join(" ");
}
