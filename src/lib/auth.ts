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
const ACCESS_TOKEN_EXPIRES_IN = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // 7 days

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
      throw new Error('Invalid encrypted data format');
    }

    const [ivHex, authTagHex, encrypted] = parts;

    // Convert from hex
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Create decipher
    const decipher = createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, 'hex'),
      iv
    );

    // Set auth tag
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
    throw new Error('Decryption failed');
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
