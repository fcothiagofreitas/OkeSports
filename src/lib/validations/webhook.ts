import { z } from 'zod';

// ============================================
// WEBHOOK VALIDATION SCHEMAS
// ============================================

/**
 * Schema para webhook do Mercado Pago
 * https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export const mercadoPagoWebhookSchema = z.object({
  id: z.number(),
  live_mode: z.boolean(),
  type: z.string(), // "payment", "merchant_order", etc
  date_created: z.string(),
  user_id: z.number().optional(),
  api_version: z.string(),
  action: z.string(), // "payment.created", "payment.updated"
  data: z.object({
    id: z.string(), // Payment ID
  }),
});

export type MercadoPagoWebhookPayload = z.infer<typeof mercadoPagoWebhookSchema>;
