export interface Log {
  id: string;
  userId: string;
  canvasId: string;
  timestamp: Date;
  action: string;
  message: string;
  details: string;
  status: string;
  error: string;
}
