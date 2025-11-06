import { z } from 'zod';

// ============================================
// EVENT VALIDATION SCHEMAS
// ============================================

/**
 * Schema para localização do evento
 */
export const eventLocationSchema = z.object({
  venueName: z.string().min(1).max(200).optional(),
  street: z.string().min(1).max(200),
  number: z.string().min(1).max(20),
  complement: z.string().max(100).optional(),
  neighborhood: z.string().min(1).max(100),
  city: z.string().min(1).max(100),
  state: z.string().length(2).toUpperCase(), // UF (SP, RJ, etc)
  cep: z
    .string()
    .min(1)
    .regex(/^\d{5}-?\d{3}$/, 'CEP inválido')
    .transform((val) => val.replace(/\D/g, '')), // Remove hífen
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

/**
 * Schema para criar evento
 */
export const createEventSchema = z
  .object({
    // Informações básicas
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(200),
    description: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
    shortDescription: z.string().max(200).optional(),

    // Datas
    eventDate: z.string().datetime().or(z.date()),
    registrationStart: z.string().datetime().or(z.date()),
    registrationEnd: z.string().datetime().or(z.date()),

    // Localização (opcional, pode adicionar depois)
    location: eventLocationSchema.optional(),

    // Visual (URLs)
    bannerUrl: z.string().url().optional(),
    logoUrl: z.string().url().optional(),
    coverUrl: z.string().url().optional(),

    // Configurações
    maxRegistrations: z.number().int().positive().optional(),
    allowGroupReg: z.boolean().default(true),
    maxGroupSize: z.number().int().min(1).max(100).default(10),

    // Status inicial
    status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  })
  .refine(
    (data) => {
      const eventDate = new Date(data.eventDate);
      const regStart = new Date(data.registrationStart);
      const regEnd = new Date(data.registrationEnd);

      // Validar que data do evento é futura
      if (eventDate < new Date()) {
        return false;
      }

      // Validar que início das inscrições < fim das inscrições < data do evento
      return regStart < regEnd && regEnd <= eventDate;
    },
    {
      message:
        'Datas inválidas: inscrições devem começar antes de terminar, e terminar antes do evento',
    }
  );

/**
 * Schema para atualizar evento
 */
export const updateEventSchema = z
  .object({
    name: z.string().min(3).max(200).optional(),
    description: z.string().min(10).optional(),
    shortDescription: z.string().max(200).optional(),

    eventDate: z.string().datetime().or(z.date()).optional(),
    registrationStart: z.string().datetime().or(z.date()).optional(),
    registrationEnd: z.string().datetime().or(z.date()).optional(),

    location: eventLocationSchema.optional(),

    bannerUrl: z.string().url().optional().nullable(),
    logoUrl: z.string().url().optional().nullable(),
    coverUrl: z.string().url().optional().nullable(),

    status: z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'SOLD_OUT', 'FINISHED', 'CANCELLED']).optional(),
    maxRegistrations: z.number().int().positive().optional().nullable(),
    allowGroupReg: z.boolean().optional(),
    maxGroupSize: z.number().int().min(1).max(100).optional(),
  })
  .partial();

/**
 * Schema para query params de listagem
 */
export const listEventsQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'PAUSED', 'SOLD_OUT', 'FINISHED', 'CANCELLED']).optional(),
  search: z.string().optional(), // Buscar por nome
});

/**
 * Helper para gerar slug a partir do nome do evento
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD') // Remove acentos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
    .replace(/\s+/g, '-') // Substitui espaços por hífens
    .replace(/-+/g, '-') // Remove hífens duplicados
    .trim();
}

/**
 * Helper para garantir slug único
 */
export function ensureUniqueSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
