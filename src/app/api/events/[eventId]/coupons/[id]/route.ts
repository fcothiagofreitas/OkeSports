import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/auth';
import prisma from '@/lib/db';
import { updateCouponSchema } from '@/lib/validations/modality';
import { ZodError } from 'zod';

async function updateCoupon(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId, id } = await params;
    const body = await request.json();

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { event: { select: { organizerId: true } } },
    });

    if (!coupon || coupon.eventId !== eventId || coupon.event.organizerId !== userId) {
      return NextResponse.json({ error: 'Cupom não encontrado ou sem permissão' }, { status: 404 });
    }

    const validatedData = updateCouponSchema.parse(body);

    const updateData: any = { ...validatedData };
    if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);

    const updated = await prisma.coupon.update({ where: { id }, data: updateData });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Dados inválidos', details: error.errors }, { status: 400 });
    }
    console.error('Update coupon error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar cupom' }, { status: 500 });
  }
}

async function deleteCoupon(
  request: NextRequest & { user: { userId: string } },
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  try {
    const { userId } = request.user;
    const { eventId, id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { event: { select: { organizerId: true } }, _count: { select: { registrations: true } } },
    });

    if (!coupon || coupon.eventId !== eventId || coupon.event.organizerId !== userId) {
      return NextResponse.json({ error: 'Cupom não encontrado ou sem permissão' }, { status: 404 });
    }

    if (coupon._count.registrations > 0) {
      return NextResponse.json(
        { error: 'Não é possível deletar cupom utilizado. Desative-o ao invés de deletar.' },
        { status: 400 }
      );
    }

    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ message: 'Cupom deletado com sucesso' });
  } catch (error) {
    console.error('Delete coupon error:', error);
    return NextResponse.json({ error: 'Erro ao deletar cupom' }, { status: 500 });
  }
}

export const PATCH = withAuth(updateCoupon);
export const DELETE = withAuth(deleteCoupon);
