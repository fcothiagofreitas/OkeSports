import { encrypt, decrypt } from './auth';
import type {
  MercadoPagoTokenResponse,
  MercadoPagoUserInfo,
  MercadoPagoOAuthError,
} from '@/types/mercadopago';

// ============================================
// MERCADO PAGO OAUTH HELPERS
// ============================================

const MP_CLIENT_ID = process.env.MP_CLIENT_ID!;
const MP_CLIENT_SECRET = process.env.MP_CLIENT_SECRET!;
const MP_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/mercadopago/callback`;

const MP_OAUTH_URL = 'https://auth.mercadopago.com.br/authorization';
const MP_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';
const MP_USER_INFO_URL = 'https://api.mercadopago.com/users/me';

/**
 * Gera URL de autorização OAuth do Mercado Pago
 * @param state - String aleatória para validar callback (deve ser o userId)
 */
export function generateMercadoPagoAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: MP_CLIENT_ID,
    response_type: 'code',
    platform_id: 'mp', // Marketplace
    state, // userId para validar no callback
    redirect_uri: MP_REDIRECT_URI,
  });

  return `${MP_OAUTH_URL}?${params.toString()}`;
}

/**
 * Troca código de autorização por access_token e refresh_token
 * @param code - Código retornado pelo Mercado Pago no callback
 */
export async function exchangeCodeForTokens(
  code: string
): Promise<MercadoPagoTokenResponse> {
  const response = await fetch(MP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: MP_CLIENT_ID,
      client_secret: MP_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: MP_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as MercadoPagoOAuthError;
    throw new Error(
      `Mercado Pago OAuth error: ${error.error_description || error.message}`
    );
  }

  return response.json();
}

/**
 * Renova access_token usando refresh_token
 * @param refreshToken - Refresh token encriptado do banco
 */
export async function refreshMercadoPagoToken(
  refreshToken: string
): Promise<MercadoPagoTokenResponse> {
  // Desencriptar refresh token
  const decryptedRefreshToken = decrypt(refreshToken);

  const response = await fetch(MP_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: MP_CLIENT_ID,
      client_secret: MP_CLIENT_SECRET,
      refresh_token: decryptedRefreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const error = (await response.json()) as MercadoPagoOAuthError;
    throw new Error(
      `Mercado Pago refresh token error: ${error.error_description || error.message}`
    );
  }

  return response.json();
}

/**
 * Busca informações do usuário Mercado Pago
 * @param accessToken - Access token (pode estar encriptado)
 */
export async function getMercadoPagoUserInfo(
  accessToken: string
): Promise<MercadoPagoUserInfo> {
  // Tentar desencriptar (se vier do banco vem encriptado)
  let token = accessToken;
  try {
    token = decrypt(accessToken);
  } catch {
    // Se falhar, assumir que já está em plaintext
    token = accessToken;
  }

  const response = await fetch(MP_USER_INFO_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Mercado Pago user info: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Valida se o access_token ainda está válido
 * @param accessToken - Access token encriptado
 * @param expiresAt - Data de expiração do token
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() >= new Date(expiresAt);
}

/**
 * Encripta tokens OAuth para armazenar no banco
 */
export function encryptOAuthTokens(data: {
  accessToken: string;
  refreshToken: string;
}): {
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
} {
  return {
    encryptedAccessToken: encrypt(data.accessToken),
    encryptedRefreshToken: encrypt(data.refreshToken),
  };
}

/**
 * Limpa e valida token encriptado do banco
 */
function cleanAndValidateEncryptedToken(token: string | null | undefined, tokenName: string): string {
  if (!token) {
    throw new Error(`${tokenName} is missing`);
  }
  
  const cleaned = token.trim().replace(/\s+/g, '');
  
  if (!cleaned) {
    throw new Error(`${tokenName} is empty after cleaning`);
  }
  
  const colonCount = (cleaned.match(/:/g) || []).length;
  if (colonCount < 2) {
    throw new Error(
      `${tokenName} has invalid format: expected 'iv:authTag:encrypted' (3 parts), ` +
      `but found ${colonCount + 1} part(s). ` +
      `Please reconnect the Mercado Pago account to generate a new token.`
    );
  }
  
  return cleaned;
}

/**
 * Desencripta tokens OAuth do banco
 */
export function decryptOAuthTokens(data: {
  encryptedAccessToken: string;
  encryptedRefreshToken: string;
}): {
  accessToken: string;
  refreshToken: string;
} {
  try {
    const cleanedAccessToken = cleanAndValidateEncryptedToken(
      data.encryptedAccessToken,
      'Encrypted access token'
    );
    
    const accessTokenParts = cleanedAccessToken.split(':');
    
    if (accessTokenParts.length !== 3) {
      throw new Error(
        `Invalid encrypted access token format: expected 3 parts, got ${accessTokenParts.length}. ` +
        `Token may have been encrypted with a different ENCRYPTION_KEY. ` +
        `Please reconnect the Mercado Pago account.`
      );
    }
    
    const [ivHex, authTagHex] = accessTokenParts;
    if (ivHex.length !== 32 || authTagHex.length !== 32) {
      throw new Error('Invalid token format: IV and authTag must be 32 hex characters each');
    }
    
    const accessToken = decrypt(cleanedAccessToken);
    
    let refreshToken = '';
    if (data.encryptedRefreshToken?.trim()) {
      const cleanedRefreshToken = cleanAndValidateEncryptedToken(
        data.encryptedRefreshToken,
        'Encrypted refresh token'
      );
      refreshToken = decrypt(cleanedRefreshToken);
    }
    
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes('Invalid encrypted') ||
        error.message.includes('Decryption failed') ||
        error.message.includes('Invalid token format')
      ) {
        throw error;
      }
      throw new Error(
        `Failed to decrypt OAuth tokens: ${error.message}. ` +
        `Token may have been encrypted with a different ENCRYPTION_KEY. ` +
        `Please reconnect the Mercado Pago account.`
      );
    }
    throw new Error('Failed to decrypt OAuth tokens: Unknown error');
  }
}

/**
 * Calcula data de expiração do token
 * @param expiresIn - Segundos até expiração (retornado pelo MP)
 */
export function calculateTokenExpiration(expiresIn: number): Date {
  const now = new Date();
  return new Date(now.getTime() + expiresIn * 1000);
}
