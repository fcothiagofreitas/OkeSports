import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractBearerToken } from '@/lib/auth';
import type { AuthTokenPayload } from '@/types/auth';

/**
 * Authentication middleware for API routes
 * Verifies JWT token and attaches user data to request
 *
 * Usage in API route:
 * ```ts
 * import { withAuth } from '@/lib/middleware/auth';
 *
 * async function handler(request: NextRequest & { user: AuthTokenPayload }) {
 *   const userId = request.user.userId;
 *   // ... your code
 * }
 *
 * export const GET = withAuth(handler);
 * ```
 */
export function withAuth(
  handler: (
    request: NextRequest & { user: AuthTokenPayload },
    context?: any
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Extract Authorization header
      const authHeader = request.headers.get('Authorization');

      // Extract token from Bearer header
      const token = extractBearerToken(authHeader);

      if (!token) {
        return NextResponse.json(
          { error: 'Token de autenticação não fornecido' },
          { status: 401 }
        );
      }

      // Verify token
      const payload = verifyAccessToken(token);

      // Attach user data to request
      const authenticatedRequest = request as NextRequest & {
        user: AuthTokenPayload;
      };
      authenticatedRequest.user = payload;

      // Call the original handler
      return await handler(authenticatedRequest, context);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid access token')) {
        return NextResponse.json(
          { error: 'Token inválido ou expirado' },
          { status: 401 }
        );
      }

      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Erro de autenticação' },
        { status: 401 }
      );
    }
  };
}

/**
 * Optional authentication middleware
 * Attaches user data if token is present, but doesn't fail if not
 *
 * Usage:
 * ```ts
 * import { withOptionalAuth } from '@/lib/middleware/auth';
 *
 * async function handler(request: NextRequest & { user?: AuthTokenPayload }) {
 *   if (request.user) {
 *     // User is authenticated
 *   } else {
 *     // User is not authenticated (guest)
 *   }
 * }
 *
 * export const GET = withOptionalAuth(handler);
 * ```
 */
export function withOptionalAuth(
  handler: (
    request: NextRequest & { user?: AuthTokenPayload }
  ) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Extract Authorization header
      const authHeader = request.headers.get('Authorization');

      // Extract token from Bearer header
      const token = extractBearerToken(authHeader);

      if (token) {
        try {
          // Verify token
          const payload = verifyAccessToken(token);

          // Attach user data to request
          const authenticatedRequest = request as NextRequest & {
            user?: AuthTokenPayload;
          };
          authenticatedRequest.user = payload;

          return await handler(authenticatedRequest);
        } catch {
          // Token is invalid, but that's OK (optional auth)
          // Continue without user data
        }
      }

      // No token or invalid token - continue as guest
      return await handler(request as NextRequest & { user?: AuthTokenPayload });
    } catch (error) {
      console.error('Optional auth middleware error:', error);
      // Don't fail on error in optional auth
      return await handler(request as NextRequest & { user?: AuthTokenPayload });
    }
  };
}
