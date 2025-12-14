import { z } from 'zod';

/**
 * Schema para criar lote
 */
export const createBatchSchema = z
  .object({
    name: z.string().min(1, 'Nome do lote é obrigatório').max(100),
    type: z.enum(['DATE', 'VOLUME']),
    
    // Campos condicionais baseados no tipo
    startDate: z.string().datetime().or(z.date()).optional(),
    endDate: z.string().datetime().or(z.date()).optional(),
    maxSales: z.number().int().positive().optional(),
    
    // Desconto (opcional)
    discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    discountValue: z.number().positive().optional(),
    
    active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'DATE') {
      // Lote por data: startDate e endDate são obrigatórios
      if (!data.startDate || !data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startDate'],
          message: 'Data de início e fim são obrigatórias para lotes por data',
        });
      } else {
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
    } else if (data.type === 'VOLUME') {
      // Lote por volume: maxSales é obrigatório
      if (!data.maxSales || data.maxSales <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maxSales'],
          message: 'Quantidade máxima de vendas é obrigatória para lotes por volume',
        });
      }
    }
    
    // Se tem desconto, deve ter tipo e valor
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
    
    // Validar valores de desconto
    if (data.discountType === 'PERCENTAGE' && data.discountValue) {
      if (data.discountValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discountValue'],
          message: 'Desconto percentual não pode ser maior que 100%',
        });
      }
    }
  });

/**
 * Schema para atualizar lote
 */
export const updateBatchSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    type: z.enum(['DATE', 'VOLUME']).optional(),
    startDate: z.string().datetime().or(z.date()).optional().nullable(),
    endDate: z.string().datetime().or(z.date()).optional().nullable(),
    maxSales: z.number().int().positive().optional().nullable(),
    discountType: z.enum(['PERCENTAGE', 'FIXED']).optional().nullable(),
    discountValue: z.number().positive().optional().nullable(),
    active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    // Se está atualizando para DATE, validar datas
    if (data.type === 'DATE' || (data.startDate !== undefined || data.endDate !== undefined)) {
      const startDate = data.startDate !== null ? new Date(data.startDate as any) : null;
      const endDate = data.endDate !== null ? new Date(data.endDate as any) : null;
      
      if (startDate && endDate && startDate >= endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endDate'],
          message: 'Data de fim deve ser depois da data de início',
        });
      }
    }
    
    // Se está atualizando para VOLUME, validar maxSales
    if (data.type === 'VOLUME' && data.maxSales !== undefined && data.maxSales !== null) {
      if (data.maxSales <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maxSales'],
          message: 'Quantidade máxima de vendas deve ser maior que zero',
        });
      }
    }
    
    // Validar desconto
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
    
    if (data.discountType === 'PERCENTAGE' && data.discountValue) {
      if (data.discountValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discountValue'],
          message: 'Desconto percentual não pode ser maior que 100%',
        });
      }
    }
  });

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateBatchInput = z.infer<typeof updateBatchSchema>;

