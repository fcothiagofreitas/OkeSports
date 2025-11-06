import { z } from 'zod';

// ============================================
// MODALITY VALIDATION SCHEMAS
// ============================================

/**
 * Schema para criar modalidade
 */
export const createModalitySchema = z.object({
  eventId: z.string().cuid(),
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive('Preço deve ser positivo').multipleOf(0.01),
  maxSlots: z.number().int().positive().optional(),
  order: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

/**
 * Schema para atualizar modalidade
 */
export const updateModalitySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  price: z.number().positive().multipleOf(0.01).optional(),
  maxSlots: z.number().int().positive().optional().nullable(),
  order: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

// ============================================
// BATCH VALIDATION SCHEMAS
// ============================================

/**
 * Schema para criar lote
 */
export const createBatchSchema = z
  .object({
    eventId: z.string().cuid(),
    name: z.string().min(1, 'Nome é obrigatório').max(100),
    type: z.enum(['DATE', 'VOLUME']),

    // Por data
    startDate: z.string().datetime().or(z.date()).optional(),
    endDate: z.string().datetime().or(z.date()).optional(),

    // Por volume
    maxSales: z.number().int().positive().optional(),

    // Desconto
    discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    discountValue: z.number().positive().multipleOf(0.01).optional(),

    active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // Se type=DATE, startDate e endDate são obrigatórios
      if (data.type === 'DATE') {
        return data.startDate && data.endDate;
      }
      return true;
    },
    {
      message: 'Lote por data requer startDate e endDate',
    }
  )
  .refine(
    (data) => {
      // Se type=VOLUME, maxSales é obrigatório
      if (data.type === 'VOLUME') {
        return data.maxSales && data.maxSales > 0;
      }
      return true;
    },
    {
      message: 'Lote por volume requer maxSales',
    }
  )
  .refine(
    (data) => {
      // Se tem desconto, precisa de tipo e valor
      if (data.discountType || data.discountValue) {
        return data.discountType && data.discountValue;
      }
      return true;
    },
    {
      message: 'Desconto requer tipo e valor',
    }
  )
  .refine(
    (data) => {
      // Desconto percentual não pode ser > 100%
      if (data.discountType === 'PERCENTAGE' && data.discountValue) {
        return data.discountValue <= 100;
      }
      return true;
    },
    {
      message: 'Desconto percentual não pode ser maior que 100%',
    }
  );

/**
 * Schema para atualizar lote
 */
export const updateBatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startDate: z.string().datetime().or(z.date()).optional().nullable(),
  endDate: z.string().datetime().or(z.date()).optional().nullable(),
  maxSales: z.number().int().positive().optional().nullable(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional().nullable(),
  discountValue: z.number().positive().multipleOf(0.01).optional().nullable(),
  active: z.boolean().optional(),
});

// ============================================
// COUPON VALIDATION SCHEMAS
// ============================================

/**
 * Schema para criar cupom
 */
export const createCouponSchema = z
  .object({
    eventId: z.string().cuid(),
    code: z
      .string()
      .min(3, 'Código deve ter no mínimo 3 caracteres')
      .max(20)
      .toUpperCase()
      .regex(/^[A-Z0-9]+$/, 'Código deve conter apenas letras e números'),
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.number().positive().multipleOf(0.01),
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
    maxUses: z.number().int().positive().optional(),
    modalityIds: z.array(z.string().cuid()).default([]),
    minPurchase: z.number().positive().multipleOf(0.01).optional(),
    active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return start < end;
    },
    {
      message: 'Data de início deve ser antes da data de fim',
    }
  )
  .refine(
    (data) => {
      // Desconto percentual não pode ser > 100%
      if (data.discountType === 'PERCENTAGE') {
        return data.discountValue <= 100;
      }
      return true;
    },
    {
      message: 'Desconto percentual não pode ser maior que 100%',
    }
  );

/**
 * Schema para atualizar cupom
 */
export const updateCouponSchema = z.object({
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.number().positive().multipleOf(0.01).optional(),
  startDate: z.string().datetime().or(z.date()).optional(),
  endDate: z.string().datetime().or(z.date()).optional(),
  maxUses: z.number().int().positive().optional().nullable(),
  modalityIds: z.array(z.string().cuid()).optional(),
  minPurchase: z.number().positive().multipleOf(0.01).optional().nullable(),
  active: z.boolean().optional(),
});

/**
 * Schema para validar cupom (no checkout)
 */
export const validateCouponSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  eventId: z.string().cuid(),
  modalityId: z.string().cuid().optional(),
  purchaseAmount: z.number().positive(),
});
