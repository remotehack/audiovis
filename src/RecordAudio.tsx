import { FC, useState } from "react";

const RecordAudio: FC<{ onCreated: (blob: Blob) => void }> = ({
  onCreated,
}) => {
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };
    recorder.onstop = () => {
      const audioBlob = new Blob(chunks, { type: recorder.mimeType });
      onCreated(audioBlob);
    };

    recorder.start();
    setIsRecording(true);
    setTimeout(() => {
      recorder?.stop();
      setIsRecording(false);

      for (const track of stream.getTracks()) {
        track.stop();
      }
    }, 5000); // Stop recording after 5 seconds
  };

  return (
    <div>
      <button onClick={startRecording} disabled={isRecording}>
        {isRecording ? "Recording..." : "Add Recording"}
      </button>
    </div>
  );
};

export default RecordAudio;
