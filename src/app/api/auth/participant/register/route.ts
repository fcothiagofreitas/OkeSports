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

    // Verificar se email já existe COM SENHA (conta ativa na OkeSports)
    // Email pode repetir para inscrições de terceiros, mas não para contas com senha
    const existingEmail = await prisma.participant.findFirst({
      where: { 
        email: validatedData.email.toLowerCase().trim(),
        password: { not: null }, // Apenas contas com senha (cadastro na OkeSports)
      },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado na OkeSports. Use outro email ou faça login.' },
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

    // Validar e formatar data de nascimento
    let birthDate: Date;
    if (validatedData.birthDate) {
      try {
        birthDate = new Date(validatedData.birthDate);
        // Validar se a data é válida
        if (isNaN(birthDate.getTime())) {
          return NextResponse.json(
            { error: 'Data de nascimento inválida' },
            { status: 400 }
          );
        }
        // Validar se a data não é no futuro
        if (birthDate > new Date()) {
          return NextResponse.json(
            { error: 'Data de nascimento não pode ser no futuro' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Data de nascimento inválida' },
          { status: 400 }
        );
      }
    } else {
      // Data padrão se não informada (01/01/2000)
      birthDate = new Date('2000-01-01T00:00:00.000Z');
    }

    // Criar participante
    const participant = await prisma.participant.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        fullName: validatedData.fullName,
        cpf: validatedData.cpf,
        phone: validatedData.phone,
        birthDate: birthDate,
        gender: (validatedData.gender || 'NOT_INFORMED') as 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_INFORMED',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        cpf: true,
        phone: true,
        birthDate: true,
        gender: true,
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

    // Log detalhado do erro
    console.error('Register participant error:', error);
    
    // Se for erro do Prisma, retornar mensagem mais específica
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as { code?: string; meta?: any; message?: string };
      
      // Erro de constraint (unique, etc)
      if (prismaError.code === 'P2002') {
        const field = prismaError.meta?.target?.[0] || 'campo';
        return NextResponse.json(
          { 
            error: `Este ${field === 'email' ? 'email' : field === 'cpf' ? 'CPF' : field} já está cadastrado`,
            details: prismaError.meta
          },
          { status: 400 }
        );
      }
      
      // Erro de validação
      if (prismaError.code === 'P2003' || prismaError.code === 'P2011') {
        return NextResponse.json(
          { 
            error: 'Dados inválidos. Verifique os campos informados.',
            details: prismaError.message
          },
          { status: 400 }
        );
      }
      
      // Outros erros do Prisma
      return NextResponse.json(
        { 
          error: 'Erro ao criar conta. Tente novamente.',
          details: process.env.NODE_ENV === 'development' ? prismaError.message : undefined
        },
        { status: 500 }
      );
    }

    // Erro genérico
    return NextResponse.json(
      { 
        error: 'Erro ao criar conta. Tente novamente.',
        details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
