import { z } from 'zod';

// ============================================
// WEBHOOK VALIDATION SCHEMAS
// ============================================

/**
 * Schema para webhook do Mercado Pago
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 *
 * Nota: Na simulação e em alguns eventos o MP envia "id" como string; aceitamos string ou number.
 */
export const mercadoPagoWebhookSchema = z.object({
  id: z.union([z.string(), z.number()]), // Simulação envia string "123456"
  live_mode: z.boolean(),
  type: z.string(), // "payment", "merchant_order", etc
  date_created: z.string().optional(), // Nem sempre presente no root (pode estar só em data)
  user_id: z.union([z.string(), z.number()]).optional(),
  api_version: z.string().optional(),
  action: z.string(), // "payment.created", "payment.updated"
  data: z.object({
    id: z.union([z.string(), z.number()]), // Payment ID (string ou number)
    date_created: z.string().optional(),
  }),
});

export type MercadoPagoWebhookPayload = z.infer<typeof mercadoPagoWebhookSchema>;
