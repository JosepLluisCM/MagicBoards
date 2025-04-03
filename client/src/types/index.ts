// Export types from the new data models only
export * from "./canvas";
export * from "./image";

// Interface for Stage position (not in the data models but used in the Canvas component)
export interface StagePosition {
  x: number;
  y: number;
  scale: number;
}
