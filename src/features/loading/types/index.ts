export type ViewMode = "top" | "side";

export interface LayerSlice {
  index: number;
  label: string;
  yMin: number; // cm desde el piso
  yMax: number;
  packageIds: string[];
}
