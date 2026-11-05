// UI copy. Other locales (it/de/en) will implement the same Messages shape.
export const fr = {
  app: {
    title: "Vinomatrix",
    tagline: "Choisissez une parcelle et un cépage : découvrez le vin et pourquoi.",
  },
  map: {
    attributionParcels:
      "Source : SITN, Service de l'agriculture du canton de Neuchâtel (via geodienste.ch)",
    loadError: "Impossible de charger les parcelles.",
  },
};

export type Messages = typeof fr;
