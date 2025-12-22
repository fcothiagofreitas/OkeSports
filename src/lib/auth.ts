import { compare, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import type { AuthTokenPayload } from '@/types/auth';

// ============================================
// CONSTANTS
// ============================================

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

// Token expiration times
const ACCESS_TOKEN_EXPIRES_IN = '30d'; // 30 dias (desabilitado expiração curta)
const REFRESH_TOKEN_EXPIRES_IN = '90d'; // 90 dias

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';

// ============================================
// PASSWORD HASHING
// ============================================

/**
 * Hash password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12);
}

/**
 * Compare plain text password with hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return compare(password, hashedPassword);
}

// ============================================
// JWT TOKENS
// ============================================

/**
 * Generate JWT access token
 * @param payload - User data to encode in token
 * @returns JWT access token
 */
export function generateAccessToken(payload: AuthTokenPayload): string {
  return sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

/**
 * Generate JWT refresh token
 * @param payload - User data to encode in token
 * @returns JWT refresh token
 */
export function generateRefreshToken(payload: AuthTokenPayload): string {
  return sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    algorithm: 'HS256',
  });
}

/**
 * Verify JWT access token
 * @param token - JWT access token
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    return verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    }) as AuthTokenPayload;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid access token: ${error.message}`);
    }
    throw new Error('Invalid access token');
  }
}

/**
 * Verify JWT refresh token
 * @param token - JWT refresh token
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): AuthTokenPayload {
  try {
    return verify(token, JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    }) as AuthTokenPayload;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid refresh token: ${error.message}`);
    }
    throw new Error('Invalid refresh token');
  }
}

// ============================================
// ENCRYPTION (for OAuth tokens)
// ============================================

/**
 * Encrypt sensitive data (OAuth tokens, etc)
 * Uses AES-256-GCM for authenticated encryption
 * @param text - Plain text to encrypt
 * @returns Encrypted data (iv:authTag:encrypted)
 */
export function encrypt(text: string): string {
  // Generate random IV (initialization vector)
  const iv = randomBytes(16);

  // Create cipher
  const cipher = createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    iv
  );

  // Encrypt
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get auth tag (for GCM mode)
  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 * @param encryptedData - Encrypted data (iv:authTag:encrypted)
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  try {
    // Split encrypted data
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error(`Invalid encrypted data format: expected 3 parts, got ${parts.length}`);
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Validate hex format
    const hexRegex = /^[0-9a-fA-F]+$/;
    if (!hexRegex.test(ivHex) || !hexRegex.test(authTagHex) || !hexRegex.test(encrypted)) {
      throw new Error('Invalid hex format in encrypted data');
    }

    // Validate ENCRYPTION_KEY
    if (!ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY is not defined');
    }
    
    if (ENCRYPTION_KEY.length !== 64) {
      throw new Error(`ENCRYPTION_KEY has invalid length: expected 64 hex chars (32 bytes), got ${ENCRYPTION_KEY.length}`);
    }
    
    if (!hexRegex.test(ENCRYPTION_KEY)) {
      throw new Error('ENCRYPTION_KEY is not valid hexadecimal');
    }

    // Convert from hex
    let iv: Buffer;
    let authTag: Buffer;
    let key: Buffer;
    
    try {
      iv = Buffer.from(ivHex, 'hex');
      authTag = Buffer.from(authTagHex, 'hex');
      key = Buffer.from(ENCRYPTION_KEY, 'hex');
    } catch (bufferError) {
      throw new Error(`Failed to convert hex to buffer: ${bufferError instanceof Error ? bufferError.message : String(bufferError)}`);
    }

    // Validate buffer sizes
    if (iv.length !== 16) {
      throw new Error(`Invalid IV length: expected 16 bytes, got ${iv.length}`);
    }
    if (authTag.length !== 16) {
      throw new Error(`Invalid auth tag length: expected 16 bytes, got ${authTag.length}`);
    }
    if (key.length !== 32) {
      throw new Error(`Invalid key length: expected 32 bytes, got ${key.length}`);
    }

    // Create decipher
    let decipher;
    try {
      decipher = createDecipheriv(ALGORITHM, key, iv);
    } catch (cipherError) {
      throw new Error(`Failed to create decipher: ${cipherError instanceof Error ? cipherError.message : String(cipherError)}`);
    }

    // Set auth tag
    try {
      decipher.setAuthTag(authTag);
    } catch (tagError) {
      throw new Error(`Failed to set auth tag: ${tagError instanceof Error ? tagError.message : String(tagError)}`);
    }

    // Decrypt
    let decrypted: string;
    try {
      decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
    } catch (decryptError) {
      // This is the most common error - wrong key or corrupted data
      const errorMsg = decryptError instanceof Error ? decryptError.message : String(decryptError);
      if (errorMsg.includes('Unsupported state') || errorMsg.includes('bad decrypt') || errorMsg.includes('wrong final block length')) {
        throw new Error(`Decryption failed: Wrong encryption key or corrupted data. The token was encrypted with a different ENCRYPTION_KEY. Original error: ${errorMsg}`);
      }
      throw new Error(`Decryption failed: ${errorMsg}`);
    }

    return decrypted;
  } catch (error) {
    if (error instanceof Error) {
      throw error; // Re-throw with the detailed message
    }
    throw new Error('Decryption failed: Unknown error');
  }
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Extract Bearer token from Authorization header
 * @param authHeader - Authorization header value
 * @returns JWT token or null
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7); // Remove "Bearer " prefix
}

/**
 * Validate CPF format (basic validation)
 * @param cpf - CPF string
 * @returns True if CPF format is valid
 */
export function isValidCPF(cpf: string): boolean {
  // Remove non-digits
  const cleanCPF = cpf.replace(/\D/g, '');

  // Check length
  if (cleanCPF.length !== 11) {
    return false;
  }

  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }

  // TODO: Implement full CPF validation algorithm if needed
  return true;
}

/**
 * Validate CNPJ format (basic validation)
 * @param cnpj - CNPJ string
 * @returns True if CNPJ format is valid
 */
export function isValidCNPJ(cnpj: string): boolean {
  // Remove non-digits
  const cleanCNPJ = cnpj.replace(/\D/g, '');

  // Check length
  if (cleanCNPJ.length !== 14) {
    return false;
  }

  // Check if all digits are the same (invalid CNPJ)
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) {
    return false;
  }

  // TODO: Implement full CNPJ validation algorithm if needed
  return true;
}

/**
 * Validate if string is CPF or CNPJ
 * @param cpfCnpj - CPF or CNPJ string
 * @returns True if valid CPF or CNPJ
 */
export function isValidCPForCNPJ(cpfCnpj: string): boolean {
  const clean = cpfCnpj.replace(/\D/g, '');

  if (clean.length === 11) {
    return isValidCPF(cpfCnpj);
  } else if (clean.length === 14) {
    return isValidCNPJ(cpfCnpj);
  }

  return false;
}
