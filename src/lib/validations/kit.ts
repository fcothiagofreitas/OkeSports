import { z } from 'zod';

/**
 * Schema para item do kit
 */
export const kitItemSchema = z.object({
  name: z.string().min(1, 'Nome do item é obrigatório'),
  included: z.boolean().default(true),
});

/**
 * Schema para tamanho e estoque
 */
export const kitSizeStockSchema = z.object({
  size: z.enum(['PP', 'P', 'M', 'G', 'GG', 'XG']),
  stock: z.number().int().min(0, 'Estoque deve ser maior ou igual a 0'),
});

/**
 * Schema para criar/atualizar kit
 */
export const createKitSchema = z.object({
  items: z.array(kitItemSchema).optional(),
  includeShirt: z.boolean().default(true),
  shirtRequired: z.boolean().default(false),
  sizes: z.array(kitSizeStockSchema).optional(),
});

/**
 * Schema para atualizar kit
 */
export const updateKitSchema = z.object({
  items: z.array(kitItemSchema).optional().nullable(),
  includeShirt: z.boolean().optional(),
  shirtRequired: z.boolean().optional(),
  sizes: z.array(kitSizeStockSchema).optional(),
});

export type CreateKitInput = z.infer<typeof createKitSchema>;
export type UpdateKitInput = z.infer<typeof updateKitSchema>;
export type KitItem = z.infer<typeof kitItemSchema>;
export type KitSizeStock = z.infer<typeof kitSizeStockSchema>;

