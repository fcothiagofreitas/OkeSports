// ============================================
// MERCADO PAGO OAUTH TYPES
// ============================================

/**
 * Response from Mercado Pago OAuth token endpoint
 * https://www.mercadopago.com.br/developers/pt/docs/security/oauth/creation
 */
export interface MercadoPagoTokenResponse {
  access_token: string;
  token_type: 'bearer';
  expires_in: number; // seconds (typically 15777000 = ~6 months)
  scope: string;
  user_id: number;
  refresh_token: string;
  public_key: string;
  live_mode: boolean;
}

/**
 * Response from Mercado Pago user info endpoint
 * https://api.mercadopago.com/users/me
 */
export interface MercadoPagoUserInfo {
  id: number;
  nickname: string;
  email: string;
  first_name: string;
  last_name: string;
  identification?: {
    type: string; // CPF, CNPJ
    number: string;
  };
  site_status: 'active' | 'inactive' | 'pending';
}

/**
 * Mercado Pago OAuth error response
 */
export interface MercadoPagoOAuthError {
  error: string;
  error_description: string;
  message?: string;
}

/**
 * Payment split configuration for marketplace
 */
export interface PaymentSplit {
  collector_id: number; // User ID que receberá o pagamento (organizador)
  application_fee: number; // Taxa da plataforma (10% em centavos)
  payment_id?: string; // ID do pagamento (retornado após criação)
}

/**
 * Payment creation request (simplified for MVP)
 */
export interface CreatePaymentRequest {
  transaction_amount: number; // Valor total em reais
  description: string; // Descrição da inscrição
  payment_method_id: 'pix' | string; // PIX ou cartão
  payer: {
    email: string;
    identification?: {
      type: 'CPF' | 'CNPJ';
      number: string;
    };
  };
  metadata?: {
    registration_id: string; // ID da inscrição no nosso sistema
    event_id: string; // ID do evento
  };
  marketplace_fee?: number; // Taxa da plataforma (10% em centavos)
}

/**
 * Payment webhook notification
 */
export interface MercadoPagoWebhook {
  id: number;
  live_mode: boolean;
  type: 'payment' | 'merchant_order' | 'subscription';
  date_created: string;
  user_id: number;
  api_version: string;
  action: 'payment.created' | 'payment.updated';
  data: {
    id: string; // Payment ID
  };
}

/**
 * Payment status from Mercado Pago
 */
export type MercadoPagoPaymentStatus =
  | 'pending' // Aguardando pagamento
  | 'approved' // Aprovado
  | 'authorized' // Autorizado (cartão)
  | 'in_process' // Em processo
  | 'in_mediation' // Em mediação
  | 'rejected' // Rejeitado
  | 'cancelled' // Cancelado
  | 'refunded' // Reembolsado
  | 'charged_back'; // Chargeback

/**
 * Full payment response from Mercado Pago
 */
export interface MercadoPagoPayment {
  id: number;
  status: MercadoPagoPaymentStatus;
  status_detail: string;
  transaction_amount: number;
  transaction_amount_refunded: number;
  date_created: string;
  date_approved?: string;
  date_last_updated: string;
  money_release_date?: string;
  payment_method_id: string;
  payment_type_id: 'credit_card' | 'debit_card' | 'bank_transfer' | 'ticket';
  description: string;
  payer: {
    id: number;
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  metadata: Record<string, any>;
  marketplace_fee?: number;
}
