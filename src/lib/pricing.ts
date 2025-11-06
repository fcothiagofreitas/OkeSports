import prisma from './db';
import type { PriceCalculation } from '@/types/checkout';
import { Decimal } from '@prisma/client/runtime/library';

// ============================================
// PRICING HELPERS
// ============================================

const PLATFORM_FEE_PERCENTAGE = 0.10; // 10%

/**
 * Encontra o lote ativo no momento
 */
async function getActiveBatch(eventId: string) {
  const now = new Date();

  // Buscar lotes ativos do evento
  const batches = await prisma.batch.findMany({
    where: {
      eventId,
      active: true,
    },
    orderBy: {
      startDate: 'asc',
    },
  });

  // Encontrar lote ativo baseado no tipo
  for (const batch of batches) {
    if (batch.type === 'DATE') {
      // Lote por data: verificar se está no período
      if (batch.startDate && batch.endDate) {
        if (now >= batch.startDate && now <= batch.endDate) {
          return batch;
        }
      }
    } else if (batch.type === 'VOLUME') {
      // Lote por volume: verificar se não esgotou
      if (batch.maxSales && batch.currentSales < batch.maxSales) {
        return batch;
      }
    }
  }

  return null;
}

/**
 * Valida e retorna cupom se válido
 */
async function validateCoupon(
  code: string,
  eventId: string,
  modalityId: string,
  purchaseAmount: number
) {
  const now = new Date();

  const coupon = await prisma.coupon.findFirst({
    where: {
      eventId,
      code: code.toUpperCase(),
      active: true,
    },
  });

  if (!coupon) {
    throw new Error('Cupom não encontrado ou inativo');
  }

  // Verificar período de validade
  if (now < coupon.startDate || now > coupon.endDate) {
    throw new Error('Cupom fora do período de validade');
  }

  // Verificar limite de usos
  if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
    throw new Error('Cupom esgotado');
  }

  // Verificar se aplica na modalidade
  if (coupon.modalityIds.length > 0 && !coupon.modalityIds.includes(modalityId)) {
    throw new Error('Cupom não válido para esta modalidade');
  }

  // Verificar compra mínima
  if (coupon.minPurchase && purchaseAmount < Number(coupon.minPurchase)) {
    throw new Error(
      `Compra mínima de R$ ${coupon.minPurchase.toString()} para usar este cupom`
    );
  }

  return coupon;
}

/**
 * Calcula desconto baseado no tipo
 */
function calculateDiscount(
  basePrice: number,
  discountType: 'PERCENTAGE' | 'FIXED',
  discountValue: number
): number {
  if (discountType === 'PERCENTAGE') {
    return (basePrice * discountValue) / 100;
  } else {
    return Math.min(discountValue, basePrice); // Desconto não pode ser maior que o preço
  }
}

/**
 * Calcula preço final da inscrição
 * Aplica lote ativo e cupom (se fornecido)
 */
export async function calculatePrice(
  eventId: string,
  modalityId: string,
  couponCode?: string
): Promise<PriceCalculation> {
  // 1. Buscar preço base da modalidade
  const modality = await prisma.modality.findUnique({
    where: { id: modalityId },
    select: { price: true, eventId: true },
  });

  if (!modality) {
    throw new Error('Modalidade não encontrada');
  }

  if (modality.eventId !== eventId) {
    throw new Error('Modalidade não pertence a este evento');
  }

  const basePrice = Number(modality.price);

  // 2. Aplicar desconto do lote ativo (se houver)
  let batchDiscount = 0;
  let batchName: string | undefined;

  const activeBatch = await getActiveBatch(eventId);
  if (activeBatch && activeBatch.discountType && activeBatch.discountValue) {
    batchDiscount = calculateDiscount(
      basePrice,
      activeBatch.discountType,
      Number(activeBatch.discountValue)
    );
    batchName = activeBatch.name;
  }

  // 3. Aplicar cupom (se fornecido)
  let couponDiscount = 0;
  let validatedCouponCode: string | undefined;

  if (couponCode) {
    try {
      const priceAfterBatch = basePrice - batchDiscount;
      const coupon = await validateCoupon(couponCode, eventId, modalityId, priceAfterBatch);

      couponDiscount = calculateDiscount(
        priceAfterBatch,
        coupon.discountType,
        Number(coupon.discountValue)
      );
      validatedCouponCode = coupon.code;
    } catch (error) {
      // Se cupom inválido, ignora (ou pode lançar erro)
      console.warn('Cupom inválido:', error);
    }
  }

  // 4. Calcular subtotal e taxa da plataforma
  const subtotal = basePrice - batchDiscount - couponDiscount;
  const platformFee = subtotal * PLATFORM_FEE_PERCENTAGE;
  const total = subtotal + platformFee;

  const discountPercentage = ((batchDiscount + couponDiscount) / basePrice) * 100;

  return {
    basePrice: Number(basePrice.toFixed(2)),
    batchDiscount: Number(batchDiscount.toFixed(2)),
    couponDiscount: Number(couponDiscount.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
    platformFee: Number(platformFee.toFixed(2)),
    total: Number(total.toFixed(2)),
    batchName,
    couponCode: validatedCouponCode,
    discountPercentage: Number(discountPercentage.toFixed(2)),
  };
}

/**
 * Incrementa uso do cupom (após pagamento aprovado)
 */
export async function incrementCouponUsage(couponId: string) {
  await prisma.coupon.update({
    where: { id: couponId },
    data: {
      currentUses: {
        increment: 1,
      },
    },
  });
}

/**
 * Incrementa vendas do lote (após pagamento aprovado)
 */
export async function incrementBatchSales(eventId: string) {
  const activeBatch = await getActiveBatch(eventId);

  if (activeBatch) {
    await prisma.batch.update({
      where: { id: activeBatch.id },
      data: {
        currentSales: {
          increment: 1,
        },
      },
    });
  }
}

/**
 * Incrementa slots vendidos da modalidade
 */
export async function incrementModalitySoldSlots(modalityId: string) {
  await prisma.modality.update({
    where: { id: modalityId },
    data: {
      soldSlots: {
        increment: 1,
      },
    },
  });
}
