import { Paper, Text, Title } from "@mantine/core";
import styles from "./App.module.css";
import { fr } from "./i18n/fr.ts";
import { ParcelMap } from "./map/ParcelMap.tsx";

export function App() {
  return (
    <main className={styles.app}>
      <ParcelMap />
      <Paper component="header" className={styles.header} px="md" py="xs">
        <Title order={1} size="h2" c="wine" mb={4}>
          {fr.app.title}
        </Title>
        <Text size="sm" c="dimmed">
          {fr.app.tagline}
        </Text>
      </Paper>
    </main>
  );
}
