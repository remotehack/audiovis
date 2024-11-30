import { FC, useMemo } from "react";
import styles from "./Audiovis.module.css";

export const Audiovis: FC<{ srcObject: Blob }> = ({ srcObject }) => {
  const url = useMemo(() => URL.createObjectURL(srcObject), [srcObject]);

  return (
    <section className={styles.container}>
      <audio src={url} controls />
    </section>
  );
};
