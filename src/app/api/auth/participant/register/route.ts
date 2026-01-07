import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth';

// Schema de validação
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter 11 dígitos'),
  phone: z.string().min(10, 'Telefone inválido'),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'NOT_INFORMED']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados
    const validatedData = registerSchema.parse(body);

    // Verificar se email já existe
    const existingEmail = await prisma.participant.findUnique({
      where: { email: validatedData.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      );
    }

    // Verificar se CPF já existe
    const existingCPF = await prisma.participant.findUnique({
      where: { cpf: validatedData.cpf },
    });

    if (existingCPF) {
      return NextResponse.json(
        { error: 'CPF já cadastrado' },
        { status: 400 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Criar participante
    const participant = await prisma.participant.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        fullName: validatedData.fullName,
        cpf: validatedData.cpf,
        phone: validatedData.phone,
        birthDate: validatedData.birthDate
          ? new Date(validatedData.birthDate)
          : new Date('2000-01-01'), // Data padrão se não informada
        gender: validatedData.gender || 'NOT_INFORMED',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        cpf: true,
        phone: true,
      },
    });

    // Gerar tokens
    const accessToken = generateAccessToken({ userId: participant.id });
    const refreshToken = generateRefreshToken({ userId: participant.id });

    // Salvar refresh token no banco
    await prisma.participant.update({
      where: { id: participant.id },
      data: {
        // refreshToken: refreshToken, // Descomentar quando adicionar campo no schema
      },
    });

    return NextResponse.json(
      {
        participant,
        accessToken,
        refreshToken,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Register participant error:', error);
    return NextResponse.json(
      { error: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
}
