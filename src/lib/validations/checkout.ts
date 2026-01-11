import { z } from 'zod';
import { isValidCPForCNPJ } from '../auth';

// ============================================
// CHECKOUT VALIDATION SCHEMAS
// ============================================

/**
 * Schema para participante no checkout
 */
export const checkoutParticipantSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Nome completo deve ter no mínimo 3 caracteres')
    .max(100)
    .trim(),
  cpf: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 11, { message: 'CPF deve ter 11 dígitos' })
    .refine(isValidCPForCNPJ, { message: 'CPF inválido' }),
  email: z.string().min(1).email().toLowerCase().trim(),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .transform((val) => val.replace(/\D/g, '')) // Remove formatação primeiro
    .refine((val) => val.length >= 10 && val.length <= 11, {
      message: 'Telefone deve ter 10 ou 11 dígitos',
    })
    .refine((val) => /^[1-9]/.test(val), {
      message: 'DDD inválido',
    }),
  birthDate: z
    .union([
      z.string().datetime(), // ISO datetime completo
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Data simples YYYY-MM-DD
      z.date(),
    ])
    .transform((val) => {
      // Se for string no formato YYYY-MM-DD, converter para ISO datetime
      if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        return new Date(val + 'T00:00:00').toISOString();
      }
      // Se já for Date, converter para ISO string
      if (val instanceof Date) {
        return val.toISOString();
      }
      // Se já for ISO string, retornar como está
      return val;
    }),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'NOT_INFORMED']).optional(),
  // Informações adicionais opcionais
  shirtSize: z.enum(['PP', 'P', 'M', 'G', 'GG', 'XG']).optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  medicalInfo: z.string().optional(),
  teamName: z.string().optional(),
});

/**
 * Schema para checkout (criar inscrição)
 */
export const checkoutSchema = z.object({
  eventId: z.string().cuid(),
  modalityId: z.string().cuid(),
  participants: z
    .array(checkoutParticipantSchema)
    .min(1, 'Adicione pelo menos um participante')
    .max(10, 'Máximo de 10 participantes por compra'),
  couponCode: z.string().toUpperCase().optional(),
  paymentMethod: z.literal('pix'), // Futuro: z.enum(['pix', 'credit_card', 'boleto'])

  // Comprador (opcional, se diferente dos participantes)
  buyerEmail: z.string().email().toLowerCase().optional(),
  buyerCpf: z
    .string()
    .transform((val) => val.replace(/\D/g, ''))
    .refine(isValidCPForCNPJ, { message: 'CPF inválido' })
    .optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CheckoutParticipantInput = z.infer<typeof checkoutParticipantSchema>;
