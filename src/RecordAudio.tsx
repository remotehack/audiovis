import { FC, useState, useEffect } from "react";

const RecordAudio: FC<{ onCreated: (blob: Blob) => void }> = ({
  onCreated,
}) => {
  const [isRecording, setIsRecording] = useState(false);

  // stop after 10s
  useEffect(() => {
    if (!isRecording) return;

    const timer = setTimeout(() => setIsRecording(false), 10000);

    return () => clearTimeout(timer);
  }, [isRecording]);

  //
  useEffect(() => {
    if (!isRecording) return;

    const stream = navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = stream.then((stream) => {
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType });

        if (audioBlob.size < 1500) {
          console.warn("Skipping small blob", audioBlob);
          return;
        }

        onCreated(audioBlob);
      };

      recorder.start();

      return recorder;
    });

    return () => {
      recorder.then((recorder) => recorder.stop());
      stream.then((stream) =>
        stream.getTracks().forEach((track) => track.stop())
      );
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);

  return (
    <div>
      <button
        onClick={() => setIsRecording((prev) => !prev)}
        style={{ background: isRecording ? "red" : "" }}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
    </div>
  );
};

export default RecordAudio;
