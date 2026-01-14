import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';

// Schema de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados
    const validatedData = loginSchema.parse(body);

    // Buscar participante por email E que tenha senha (conta ativa na OkeSports)
    // Email pode repetir para inscrições de terceiros, mas login só funciona com conta que tem senha
    const participant = await prisma.participant.findFirst({
      where: { 
        email: validatedData.email.toLowerCase().trim(),
        password: { not: null }, // Apenas contas com senha podem fazer login
      },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
        cpf: true,
        phone: true,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(
      validatedData.password,
      participant.password
    );

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Gerar tokens
    const accessToken = generateAccessToken({ userId: participant.id });
    const refreshToken = generateRefreshToken({ userId: participant.id });

    // Atualizar lastLoginAt
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        lastLoginAt: new Date(),
      },
    });

    // Remover senha da resposta
    const { password: _, ...participantData } = participant;

    return NextResponse.json({
      participant: participantData,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Login participant error:', error);
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 });
  }
}
