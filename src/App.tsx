import { useState } from "react";
import "./App.css";
import RecordAudio from "./RecordAudio";
import { Audiovis } from "./Audiovis";
import { Compare } from "./Compare";

function App() {
  const [blobs, setBlobs] = useState<Blob[]>([]);
  const [picked, setPicked] = useState<Blob[]>([]);
  console.log({ blobs, picked });

  return (
    <>
      <h1>Audiovis</h1>

      {picked.length === 2 ? (
        <>
          <h4>
            <button onClick={() => setPicked([])}>&larr;</button> Comparing
          </h4>

          <Compare a={picked[0]} b={picked[1]} />
        </>
      ) : (
        <>
          <RecordAudio onCreated={(b) => setBlobs((prev) => [b, ...prev])} />

          {blobs.map((blob, i) => (
            <Audiovis
              key={i}
              srcObject={blob}
              picked={picked.includes(blob)}
              onPick={() => setPicked((prev) => [blob, ...prev])}
            />
          ))}
        </>
      )}
    </>
  );
}

export default App;
