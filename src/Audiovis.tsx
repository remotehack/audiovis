import { FC, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Audiovis.module.css";
import { useAudioCtx } from "./AudioCtxCtx";

export const Audiovis: FC<{ srcObject: Blob }> = ({ srcObject }) => {
  const url = useMemo(() => URL.createObjectURL(srcObject), [srcObject]);
  const buffer = useAudioBuffer(srcObject);

  return (
    <section className={styles.container}>
      <audio src={url} controls />

      {buffer && <Waveform audio={buffer} />}
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
