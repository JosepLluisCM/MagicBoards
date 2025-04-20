export interface LoginRequest {
  id: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  idToken: string;
  ip?: string;
  userAgent?: string;
}
