import { useState } from "react";
import "./App.css";
import RecordAudio from "./RecordAudio";
import { Audiovis } from "./Audiovis";

function App() {
  const [blobs, setBlobs] = useState<Blob[]>([]);

  return (
    <>
      <h1>Audiovis</h1>
      <RecordAudio onCreated={(b) => setBlobs((prev) => [b, ...prev])} />

      {blobs.map((blob, i) => (
        <Audiovis key={i} srcObject={blob} />
      ))}
    </>
  );
}

export default App;
