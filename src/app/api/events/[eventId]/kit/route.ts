import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { createKitSchema, updateKitSchema } from '@/lib/validations/kit';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// ============================================
// GET /api/events/[eventId]/kit
// ============================================
// Busca o kit do evento

async function getKit(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId } = await params;

    // Verificar se evento existe e pertence ao usuário
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar este evento' },
        { status: 403 }
      );
    }

    // Buscar kit
    const kit = await prisma.kit.findUnique({
      where: { eventId },
      include: {
        sizes: {
          orderBy: {
            size: 'asc',
          },
        },
      },
    });

    return NextResponse.json({ kit });
  } catch (error) {
    console.error('Get kit error:', error);
    return NextResponse.json({ error: 'Erro ao buscar kit' }, { status: 500 });
  }
}

// ============================================
// POST /api/events/[eventId]/kit
// ============================================
// Cria o kit do evento

async function createKit(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId } = await params;
    const body = await request.json();

    // Verificar se evento existe e pertence ao usuário
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para criar kit neste evento' },
        { status: 403 }
      );
    }

    // Verificar se kit já existe
    const existingKit = await prisma.kit.findUnique({
      where: { eventId },
    });

    if (existingKit) {
      return NextResponse.json(
        { error: 'Kit já existe para este evento. Use PATCH para atualizar.' },
        { status: 409 }
      );
    }

    // Validar dados
    const validatedData = createKitSchema.parse(body);

    // Criar kit
    const kit = await prisma.kit.create({
      data: {
        event: { connect: { id: eventId } },
        items: validatedData.items ? (validatedData.items as Prisma.JsonArray) : null,
        includeShirt: validatedData.includeShirt ?? true,
        shirtRequired: validatedData.shirtRequired ?? false,
        sizes: validatedData.sizes
          ? {
              create: validatedData.sizes.map((size) => ({
                size: size.size,
                stock: size.stock,
              })),
            }
          : undefined,
      },
      include: {
        sizes: {
          orderBy: {
            size: 'asc',
          },
        },
      },
    });

    return NextResponse.json(kit, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Create kit error:', error);
    return NextResponse.json({ error: 'Erro ao criar kit' }, { status: 500 });
  }
}

// ============================================
// PATCH /api/events/[eventId]/kit
// ============================================
// Atualiza o kit do evento

async function updateKit(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId } = await params;
    const body = await request.json();

    // Verificar se evento existe e pertence ao usuário
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { organizerId: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    if (event.organizerId !== userId) {
      return NextResponse.json(
        { error: 'Você não tem permissão para editar este evento' },
        { status: 403 }
      );
    }

    // Validar dados
    const validatedData = updateKitSchema.parse(body);

    // Verificar se kit existe, se não, criar
    const existingKit = await prisma.kit.findUnique({
      where: { eventId },
    });

    const updateData: any = {};

    if (validatedData.items !== undefined) {
      updateData.items = validatedData.items === null ? Prisma.DbNull : (validatedData.items as Prisma.JsonArray);
    }
    if (validatedData.includeShirt !== undefined) updateData.includeShirt = validatedData.includeShirt;
    if (validatedData.shirtRequired !== undefined) updateData.shirtRequired = validatedData.shirtRequired;

    let kit;

    if (existingKit) {
      // Atualizar kit existente
      kit = await prisma.kit.update({
        where: { id: existingKit.id },
        data: updateData,
        include: {
          sizes: {
            orderBy: {
              size: 'asc',
            },
          },
        },
      });

      // Atualizar tamanhos se fornecidos
      if (validatedData.sizes) {
        // Deletar tamanhos existentes
        await prisma.kitSizeStock.deleteMany({
          where: { kitId: existingKit.id },
        });

        // Criar novos tamanhos
        await prisma.kitSizeStock.createMany({
          data: validatedData.sizes.map((size) => ({
            kitId: existingKit.id,
            size: size.size,
            stock: size.stock,
          })),
        });

        // Buscar kit atualizado
        kit = await prisma.kit.findUnique({
          where: { id: existingKit.id },
          include: {
            sizes: {
              orderBy: {
                size: 'asc',
              },
            },
          },
        });
      }
    } else {
      // Criar novo kit
      kit = await prisma.kit.create({
        data: {
          event: { connect: { id: eventId } },
          items: validatedData.items ? (validatedData.items as Prisma.JsonArray) : null,
          includeShirt: validatedData.includeShirt ?? true,
          shirtRequired: validatedData.shirtRequired ?? false,
          sizes: validatedData.sizes
            ? {
                create: validatedData.sizes.map((size) => ({
                  size: size.size,
                  stock: size.stock,
                })),
              }
            : undefined,
        },
        include: {
          sizes: {
            orderBy: {
              size: 'asc',
            },
          },
        },
      });
    }

    return NextResponse.json(kit);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Update kit error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar kit' }, { status: 500 });
  }
}

export const GET = withAuth(getKit);
export const POST = withAuth(createKit);
export const PATCH = withAuth(updateKit);

