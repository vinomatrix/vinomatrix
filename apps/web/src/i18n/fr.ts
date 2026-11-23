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
  legend: {
    title: "Part plantée en vigne",
    planted: "Plantée à plus de 50 %",
    partial: "Partiellement plantée",
    undeclared: "Pas de vigne déclarée",
    hideUndeclared: "Masquer les parcelles sans vigne déclarée",
    note: "Selon les surfaces viticoles déclarées à l'agriculture. Les vignes non déclarées (p. ex. privées) n'y figurent pas.",
  },
};

export type Messages = typeof fr;
