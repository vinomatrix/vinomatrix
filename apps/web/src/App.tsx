import styles from "./App.module.css";
import { fr } from "./i18n/fr.ts";
import { ParcelMap } from "./map/ParcelMap.tsx";

export function App() {
  return (
    <main className={styles.app}>
      <ParcelMap />
      <header className={styles.header}>
        <h1 className={styles.title}>{fr.app.title}</h1>
        <p className={styles.tagline}>{fr.app.tagline}</p>
      </header>
    </main>
  );
}
