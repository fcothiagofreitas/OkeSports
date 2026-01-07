import { NextRequest, NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { verifyPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import prisma from '@/lib/db';
import type { AuthResponse } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = loginSchema.parse(body);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
        cpfCnpj: true,
        mpConnected: true,
      },
    });

    // Check if user exists
    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      validatedData.password,
      user.password
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Prepare response (exclude password)
    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        cpfCnpj: user.cpfCnpj,
        mpConnected: user.mpConnected,
      },
      accessToken,
      refreshToken,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    // Zod validation error
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error },
        { status: 400 }
      );
    }

    // Prisma connection error
    if (error?.code === 'P5010' || error?.message?.includes('Cannot fetch data from service')) {
      console.error('❌ Erro de conexão com o banco de dados:', error);
      console.error('💡 Verifique se:');
      console.error('   1. O banco de dados está rodando');
      console.error('   2. A variável DATABASE_URL está configurada corretamente no .env');
      console.error('   3. Execute: npm run db:generate');
      return NextResponse.json(
        { error: 'Erro de conexão com o banco de dados. Verifique a configuração.' },
        { status: 503 }
      );
    }

    // Generic error
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
