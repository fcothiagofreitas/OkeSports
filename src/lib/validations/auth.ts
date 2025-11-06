import { z } from 'zod';
import { isValidCPForCNPJ } from '@/lib/auth';

// ============================================
// REGISTER SCHEMA
// ============================================

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(100, 'Senha muito longa')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
    ),

  fullName: z
    .string()
    .min(3, 'Nome completo é obrigatório')
    .max(100, 'Nome muito longo')
    .trim()
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),

  cpfCnpj: z
    .string()
    .min(1, 'CPF ou CNPJ é obrigatório')
    .transform((val) => val.replace(/\D/g, '')) // Remove non-digits
    .refine(isValidCPForCNPJ, {
      message: 'CPF ou CNPJ inválido',
    }),

  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(
      /^\(?([1-9]{2})\)?[\s-]?9?[0-9]{4}[\s-]?[0-9]{4}$/,
      'Telefone inválido (ex: (11) 99999-9999)'
    )
    .transform((val) => val.replace(/\D/g, '')), // Store only digits
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================
// LOGIN SCHEMA
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  password: z.string().min(1, 'Senha é obrigatória'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================
// REFRESH TOKEN SCHEMA
// ============================================

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ============================================
// UPDATE PROFILE SCHEMA (for future use)
// ============================================

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(3, 'Nome completo é obrigatório')
    .max(100, 'Nome muito longo')
    .trim()
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras')
    .optional(),

  phone: z
    .string()
    .regex(
      /^\(?([1-9]{2})\)?[\s-]?9?[0-9]{4}[\s-]?[0-9]{4}$/,
      'Telefone inválido (ex: (11) 99999-9999)'
    )
    .transform((val) => val.replace(/\D/g, ''))
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// ============================================
// CHANGE PASSWORD SCHEMA (for future use)
// ============================================

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),

    newPassword: z
      .string()
      .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
      .max(100, 'Senha muito longa')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número'
      ),

    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Nova senha deve ser diferente da atual',
    path: ['newPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
