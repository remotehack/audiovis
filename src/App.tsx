import "./App.css";
import RecordAudio from "./RecordAudio";

function App() {
  return (
    <>
      <h1>Audiovis</h1>
      <RecordAudio onCreated={(b) => console.log("recorded", b)} />
    </>
  );
}

export default App;
