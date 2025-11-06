import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import {
  createEventSchema,
  listEventsQuerySchema,
  generateSlug,
  ensureUniqueSlug,
} from '@/lib/validations/event';
import { ZodError } from 'zod';

// ============================================
// POST /api/events
// ============================================
// Cria um novo evento
// Requer autenticação

async function createEvent(request: NextRequest & { user: { userId: string } }) {
  try {
    const { userId } = request.user;
    const body = await request.json();

    // Validar dados
    const validatedData = createEventSchema.parse(body);

    // Gerar slug único
    const baseSlug = generateSlug(validatedData.name);
    const existingSlugs = await prisma.event.findMany({
      where: {
        slug: {
          startsWith: baseSlug,
        },
      },
      select: { slug: true },
    });
    const slug = ensureUniqueSlug(
      baseSlug,
      existingSlugs.map((e) => e.slug)
    );

    // Converter datas para Date se necessário
    const eventDate = new Date(validatedData.eventDate);
    const registrationStart = new Date(validatedData.registrationStart);
    const registrationEnd = new Date(validatedData.registrationEnd);

    // Criar evento com localização (se fornecida)
    const event = await prisma.event.create({
      data: {
        slug,
        name: validatedData.name,
        description: validatedData.description,
        shortDescription: validatedData.shortDescription,
        eventDate,
        registrationStart,
        registrationEnd,
        bannerUrl: validatedData.bannerUrl,
        logoUrl: validatedData.logoUrl,
        coverUrl: validatedData.coverUrl,
        status: validatedData.status || 'DRAFT',
        maxRegistrations: validatedData.maxRegistrations,
        allowGroupReg: validatedData.allowGroupReg,
        maxGroupSize: validatedData.maxGroupSize,
        organizerId: userId,
        // Localização (nested create)
        location: validatedData.location
          ? {
              create: validatedData.location,
            }
          : undefined,
        // Marcar como publicado se status for PUBLISHED
        publishedAt: validatedData.status === 'PUBLISHED' ? new Date() : null,
      },
      include: {
        location: true,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Erro ao criar evento' }, { status: 500 });
  }
}

// ============================================
// GET /api/events
// ============================================
// Lista eventos do organizador logado
// Com paginação e filtros

async function listEvents(request: NextRequest & { user: { userId: string } }) {
  try {
    const { userId } = request.user;
    const { searchParams } = request.nextUrl;

    // Validar query params
    const { page, limit, status, search } = listEventsQuerySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    });

    // Construir filtros
    const where: any = {
      organizerId: userId,
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Buscar eventos com paginação
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          location: true,
          _count: {
            select: {
              modalities: true,
              registrations: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('List events error:', error);
    return NextResponse.json({ error: 'Erro ao listar eventos' }, { status: 500 });
  }
}

export const POST = withAuth(createEvent);
export const GET = withAuth(listEvents);
