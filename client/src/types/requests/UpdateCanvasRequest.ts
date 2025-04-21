import { CanvasData, CanvasElement } from "../canvas";

export interface UpdateCanvasRequest {
  //name?: string;
  data: CanvasData;
  elements: CanvasElement[];
}
