import { NextRequest, NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations/auth';
import { hashPassword, generateAccessToken, generateRefreshToken } from '@/lib/auth';
import prisma from '@/lib/db';
import type { AuthResponse } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { cpfCnpj: validatedData.cpfCnpj },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === validatedData.email) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 400 }
        );
      }
      if (existingUser.cpfCnpj === validatedData.cpfCnpj) {
        return NextResponse.json(
          { error: 'CPF/CNPJ já cadastrado' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        fullName: validatedData.fullName,
        cpfCnpj: validatedData.cpfCnpj,
        phone: validatedData.phone,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        cpfCnpj: true,
        mpConnected: true,
        createdAt: true,
      },
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

    // Prepare response
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

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    // Zod validation error
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error },
        { status: 400 }
      );
    }

    // Prisma error
    if (error instanceof Error && error.message.includes('Prisma')) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Erro ao criar usuário' },
        { status: 500 }
      );
    }

    // Generic error
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
