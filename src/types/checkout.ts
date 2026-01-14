// ============================================
// CHECKOUT & PAYMENT TYPES
// ============================================

/**
 * Dados do participante no checkout
 */
export interface CheckoutParticipant {
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string; // ISO date
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_INFORMED';
}

/**
 * Request do checkout (criar inscrição + pagamento)
 */
export interface CheckoutRequest {
  eventId: string;
  modalityId: string;
  participants: CheckoutParticipant[]; // Pode inscrever múltiplas pessoas
  couponCode?: string;
  paymentMethod: 'pix'; // Futuro: credit_card, boleto

  // Dados do comprador (se diferente dos participantes)
  buyerEmail?: string;
  buyerCpf?: string;
}

/**
 * Cálculo de preços (detalhado)
 */
export interface PriceCalculation {
  basePrice: number; // Preço original da modalidade
  batchDiscount: number; // Desconto do lote ativo
  couponDiscount: number; // Desconto do cupom
  subtotal: number; // basePrice - batchDiscount - couponDiscount
  platformFee: number; // 10% do subtotal
  total: number; // subtotal + platformFee

  // Metadata
  batchName?: string;
  couponCode?: string;
  discountPercentage?: number;
}

/**
 * Resposta do checkout (após criar pagamento no MP)
 */
export interface CheckoutResponse {
  registrationId: string; // ID da primeira inscrição (para compatibilidade)
  registrationIds: string[]; // IDs de todas as inscrições criadas
  registrationNumber: number; // Número da primeira inscrição
  registrationNumbers: number[]; // Números de todas as inscrições
  paymentId: string; // ID do Mercado Pago (mesmo para todas as inscrições do grupo)
  paymentStatus: 'PENDING';

  // PIX data (opcional - apenas se não usar Mercado Pago)
  qrCode?: string; // Base64 image
  qrCodeText?: string; // Código PIX copia e cola

  // Mercado Pago checkout URL (se disponível)
  checkoutUrl?: string; // URL para redirecionar ao Mercado Pago

  // Pricing
  pricing: PriceCalculation;

  // Expiration
  expiresAt: string; // ISO datetime
}

/**
 * Status da inscrição (para consulta)
 */
export interface RegistrationStatus {
  id: string;
  registrationNumber: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED';

  event: {
    name: string;
    eventDate: string;
  };

  modality: {
    name: string;
  };

  participant: {
    fullName: string;
    email: string;
  };

  pricing: PriceCalculation;

  // Payment details (se aprovado)
  paymentMethod?: string;
  paidAt?: string;

  createdAt: string;
}
