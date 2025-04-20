export enum Provider {
  Google = "Google",
  Email = "Email",
}

export interface User {
  uid: string;
  email: string;
  name: string;
  avatarUrl: string;
  provider: Provider;
  createdAt: Date;
  lastLogin: Date;
  isAdmin: boolean;
  verifiedEmail: boolean;
  userAgent?: string;
  ip?: string;
}
