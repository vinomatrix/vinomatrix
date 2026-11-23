import { alpha, ColorSwatch, Group, Paper, Stack, Switch, Text } from "@mantine/core";
import { fr } from "../i18n/fr.ts";
import styles from "./MapLegend.module.css";
import { PARCEL_CLASSES } from "./parcelStyle.ts";

interface Props {
  readonly plantedOnly: boolean;
  readonly onPlantedOnlyChange: (plantedOnly: boolean) => void;
}

export function MapLegend({ plantedOnly, onPlantedOnlyChange }: Props) {
  return (
    <Paper component="section" aria-label={fr.legend.title} className={styles.legend} p="sm">
      <Stack gap="xs">
        <Text size="sm" fw={600}>
          {fr.legend.title}
        </Text>
        <Stack component="ul" gap={4} className={styles.list}>
          {PARCEL_CLASSES.map(({ key, color, fillOpacity }) => (
            <Group component="li" key={key} gap="xs" wrap="nowrap">
              <ColorSwatch
                color={alpha(color, fillOpacity)}
                size={14}
                radius="xs"
                withShadow={false}
                style={{ border: `1px solid ${color}` }}
              />
              <Text size="sm">{fr.legend[key]}</Text>
            </Group>
          ))}
        </Stack>
        <Switch
          size="sm"
          label={fr.legend.plantedOnly}
          checked={plantedOnly}
          onChange={(event) => {
            onPlantedOnlyChange(event.currentTarget.checked);
          }}
        />
        <Text size="xs" c="dimmed">
          {fr.legend.note}
        </Text>
      </Stack>
    </Paper>
  );
}
