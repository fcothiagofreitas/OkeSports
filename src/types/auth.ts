// ============================================
// AUTH TYPES
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  cpfCnpj: string;
  mpConnected: boolean;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  cpfCnpj: string;
  phone: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

// ============================================
// NEXT.JS REQUEST EXTENSIONS
// ============================================

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      ENCRYPTION_KEY: string;
      DATABASE_URL: string;
      NEXT_PUBLIC_APP_URL: string;
    }
  }
}

// Extend NextRequest to include user
export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}
