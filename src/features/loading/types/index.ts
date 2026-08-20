export type ViewMode = "top" | "side" | "3d";

export interface LayerSlice {
  index: number;
  label: string;
  yMin: number; // cm desde el piso
  yMax: number;
  packageIds: string[];
}
