import {
  createContext,
  useEffect,
  useState,
  ReactNode,
  useContext,
} from "react";

const audioCtx = createContext<AudioContext | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useAudioCtx() {
  return useContext(audioCtx);
}

export function ProvideAudioCtx({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<AudioContext>();

  useEffect(() => {
    if (!ctx) {
      function get() {
        console.log("ADDING CONTEXT");
        setCtx(new AudioContext());
      }

      window.addEventListener("click", get, { once: true });
      return () => {
        window.removeEventListener("click", get);
      };
    }
  }, [ctx]);

  return <audioCtx.Provider value={ctx}>{children}</audioCtx.Provider>;
}
