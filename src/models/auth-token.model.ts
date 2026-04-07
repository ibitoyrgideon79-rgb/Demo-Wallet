export interface AuthTokenModel {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
