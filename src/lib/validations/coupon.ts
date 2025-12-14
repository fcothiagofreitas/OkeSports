import { z } from 'zod';

/**
 * Schema para criar cupom
 */
export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(3, 'Código deve ter no mínimo 3 caracteres')
      .max(20, 'Código deve ter no máximo 20 caracteres')
      .regex(/^[A-Z0-9]+$/, 'Código deve conter apenas letras maiúsculas e números')
      .transform((val) => val.toUpperCase()),
    
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.number().positive('Valor do desconto deve ser positivo'),
    
    startDate: z.string().datetime().or(z.date()),
    endDate: z.string().datetime().or(z.date()),
    
    maxUses: z.number().int().positive().optional().nullable(),
    
    modalityIds: z.array(z.string().min(1)).optional().default([]),
    minPurchase: z.number().positive().optional().nullable(),
    
    active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    // Validar período de validade
    const start = new Date(data.startDate as any);
    const end = new Date(data.endDate as any);
    
    if (start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'Data de fim deve ser depois da data de início',
      });
    }
    
    // Validar desconto percentual
    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Desconto percentual não pode ser maior que 100%',
      });
    }
  });

/**
 * Schema para atualizar cupom
 */
export const updateCouponSchema = z
  .object({
    code: z
      .string()
      .min(3)
      .max(20)
      .regex(/^[A-Z0-9]+$/, 'Código deve conter apenas letras maiúsculas e números')
      .transform((val) => val.toUpperCase())
      .optional(),
    
    discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    discountValue: z.number().positive().optional(),
    
    startDate: z.string().datetime().or(z.date()).optional(),
    endDate: z.string().datetime().or(z.date()).optional(),
    
    maxUses: z.number().int().positive().optional().nullable(),
    modalityIds: z.array(z.string().min(1)).optional(),
    minPurchase: z.number().positive().optional().nullable(),
    
    active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // Validar período se ambas as datas estiverem presentes
    if (data.startDate && data.endDate) {
      const start = new Date(data.startDate as any);
      const end = new Date(data.endDate as any);
      
      if (start >= end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'Data de fim deve ser depois da data de início',
        });
      }
    }
    
    // Validar desconto
    if (data.discountType === 'PERCENTAGE' && data.discountValue) {
      if (data.discountValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discountValue'],
          message: 'Desconto percentual não pode ser maior que 100%',
        });
      }
    }
    
    // Se tem tipo, deve ter valor e vice-versa
    if (data.discountType && !data.discountValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Valor do desconto é obrigatório quando tipo é informado',
      });
    }
    
    if (data.discountValue && !data.discountType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountType'],
        message: 'Tipo do desconto é obrigatório quando valor é informado',
      });
    }
  });

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;

