import styles from "./App.module.css";
import { fr } from "./i18n/fr.ts";

export function App() {
  return (
    <main className={styles.app}>
      <h1 className={styles.title}>{fr.app.title}</h1>
      <p className={styles.tagline}>{fr.app.tagline}</p>
    </main>
  );
}
