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
    .trim()
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  cpf: z
    .string()
    .min(1)
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 11, { message: 'CPF deve ter 11 dígitos' })
    .refine(isValidCPForCNPJ, { message: 'CPF inválido' }),
  email: z.string().min(1).email().toLowerCase().trim(),
  phone: z
    .string()
    .min(1)
    .regex(/^\(?([1-9]{2})\)?[\s-]?9?[0-9]{4}[\s-]?[0-9]{4}$/, 'Telefone inválido')
    .transform((val) => val.replace(/\D/g, '')),
  birthDate: z.string().datetime().or(z.date()),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'NOT_INFORMED']).optional(),
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
