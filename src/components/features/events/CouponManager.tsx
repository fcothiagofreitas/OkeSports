'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Edit, Trash2, Ticket, Percent, DollarSign, Calendar, Users } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const couponSchema = z
  .object({
    code: z
      .string()
      .min(3, 'Código deve ter no mínimo 3 caracteres')
      .max(20, 'Código deve ter no máximo 20 caracteres')
      .regex(/^[A-Z0-9]+$/, 'Código deve conter apenas letras maiúsculas e números'),
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.number().positive('Valor do desconto deve ser positivo'),
    startDate: z.string().min(1, 'Data de início é obrigatória'),
    endDate: z.string().min(1, 'Data de fim é obrigatória'),
    maxUses: z.preprocess(
      (val) => {
        if (val === '' || val === null || val === undefined) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      },
      z.number().int().positive().optional()
    ),
    minPurchase: z.preprocess(
      (val) => {
        if (val === '' || val === null || val === undefined) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      },
      z.number().positive().optional()
    ),
    active: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start >= end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'Data de fim deve ser depois da data de início',
      });
    }

    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Desconto percentual não pode ser maior que 100%',
      });
    }
  });

type CouponFormData = z.infer<typeof couponSchema>;

interface Coupon {
  id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  startDate: string;
  endDate: string;
  maxUses?: number | null;
  currentUses: number;
  modalityIds: string[];
  minPurchase?: number | null;
  active: boolean;
  _count?: {
    registrations: number;
  };
}

interface CouponManagerProps {
  eventId: string;
}

export function CouponManager({ eventId }: CouponManagerProps) {
  const { accessToken } = useAuthStore();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      active: true,
    },
  });

  const discountType = watch('discountType');

  useEffect(() => {
    fetchCoupons();
  }, [eventId]);

  const fetchCoupons = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/coupons`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setCoupons(data.coupons);
      }
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
    }
  };

  const onSubmit = async (data: CouponFormData) => {
    try {
      setIsLoading(true);

      const url = editingId
        ? `/api/events/${eventId}/coupons/${editingId}`
        : `/api/events/${eventId}/coupons`;

      const method = editingId ? 'PATCH' : 'POST';

      const payload: Record<string, unknown> = {
        code: data.code.toUpperCase(),
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        maxUses: data.maxUses || null,
        modalityIds: [], // Por enquanto, sem restrição por modalidade no form
        minPurchase: data.minPurchase || null,
        active: data.active ?? true,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar cupom');
      }

      await fetchCoupons();
      reset({ active: true });
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setValue('code', coupon.code);
    setValue('discountType', coupon.discountType);
    setValue('discountValue', Number(coupon.discountValue));
    setValue('startDate', new Date(coupon.startDate).toISOString().split('T')[0]);
    setValue('endDate', new Date(coupon.endDate).toISOString().split('T')[0]);
    setValue('maxUses', coupon.maxUses || undefined);
    setValue('minPurchase', coupon.minPurchase ? Number(coupon.minPurchase) : undefined);
    setValue('active', coupon.active);
    setShowForm(true);
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm('Tem certeza que deseja deletar este cupom?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/coupons/${couponId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        await fetchCoupons();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao deletar cupom');
      }
    } catch (error) {
      console.error('Erro ao deletar cupom:', error);
      alert('Erro ao deletar cupom');
    }
  };

  const handleCancel = () => {
    reset({ active: true });
    setShowForm(false);
    setEditingId(null);
  };

  const formatDiscount = (type: string, value: number) => {
    if (type === 'PERCENTAGE') return `${value}%`;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const isCouponValid = (coupon: Coupon) => {
    const now = new Date();
    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);
    return now >= start && now <= end && coupon.active;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-[hsl(var(--dark))]">Cupons de Desconto</h3>
          <p className="text-sm text-[hsl(var(--gray-600))] mt-1">
            Crie códigos promocionais para oferecer descontos aos participantes
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Cupom
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Cupom' : 'Novo Cupom'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Código do Cupom *</Label>
                  <Input
                    id="code"
                    placeholder="Ex: CORRIDA10, AMIGO20"
                    {...register('code', {
                      onChange: (e) => {
                        setValue('code', e.target.value.toUpperCase());
                      },
                    })}
                    disabled={isLoading}
                    className="uppercase"
                  />
                  <p className="text-xs text-[hsl(var(--gray-600))]">
                    Apenas letras maiúsculas e números
                  </p>
                  {errors.code && <p className="text-sm text-red-600">{errors.code.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountType">Tipo de Desconto *</Label>
                  <Select
                    value={discountType}
                    onValueChange={(value: 'PERCENTAGE' | 'FIXED') => {
                      setValue('discountType', value);
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                      <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.discountType && (
                    <p className="text-sm text-red-600">{errors.discountType.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountValue">
                  {discountType === 'PERCENTAGE' ? 'Percentual (%)' : 'Valor (R$)'} *
                </Label>
                <Input
                  id="discountValue"
                  type="number"
                  step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                  placeholder={discountType === 'PERCENTAGE' ? 'Ex: 10' : 'Ex: 20.00'}
                  {...register('discountValue', { valueAsNumber: true })}
                  disabled={isLoading}
                />
                {errors.discountValue && (
                  <p className="text-sm text-red-600">{errors.discountValue.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    {...register('startDate')}
                    disabled={isLoading}
                  />
                  {errors.startDate && (
                    <p className="text-sm text-red-600">{errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Data de Fim *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    {...register('endDate')}
                    disabled={isLoading}
                  />
                  {errors.endDate && (
                    <p className="text-sm text-red-600">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Limite de Usos</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="Deixe vazio para ilimitado"
                    {...register('maxUses', { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {errors.maxUses && (
                    <p className="text-sm text-red-600">{errors.maxUses.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minPurchase">Compra Mínima (R$)</Label>
                  <Input
                    id="minPurchase"
                    type="number"
                    step="0.01"
                    placeholder="Deixe vazio para sem mínimo"
                    {...register('minPurchase', { valueAsNumber: true })}
                    disabled={isLoading}
                  />
                  {errors.minPurchase && (
                    <p className="text-sm text-red-600">{errors.minPurchase.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  {...register('active')}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Cupom ativo
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Cupom'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {coupons.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Ticket className="h-12 w-12 text-[hsl(var(--gray-400))] mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-[hsl(var(--dark))] mb-2">
              Nenhum cupom cadastrado
            </h4>
            <p className="text-sm text-[hsl(var(--gray-600))] mb-6">
              Adicione cupons para oferecer descontos promocionais aos participantes
            </p>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Cupom
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((coupon) => (
            <Card key={coupon.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-mono">{coupon.code}</CardTitle>
                    <CardDescription className="mt-1">
                      {formatDiscount(coupon.discountType, Number(coupon.discountValue))} de
                      desconto
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge variant={isCouponValid(coupon) ? 'default' : 'secondary'}>
                      {isCouponValid(coupon) ? 'Válido' : 'Inválido'}
                    </Badge>
                    <Badge variant={coupon.active ? 'default' : 'secondary'}>
                      {coupon.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-[hsl(var(--gray-600))]" />
                    <span className="text-[hsl(var(--gray-600))]">
                      {new Date(coupon.startDate).toLocaleDateString('pt-BR')} -{' '}
                      {new Date(coupon.endDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-[hsl(var(--gray-600))]" />
                    <span className="text-[hsl(var(--gray-600))]">
                      {coupon.currentUses} / {coupon.maxUses || '∞'} usos
                    </span>
                  </div>
                  {coupon.minPurchase && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-[hsl(var(--gray-600))]" />
                      <span className="text-[hsl(var(--gray-600))]">
                        Compra mínima: {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(Number(coupon.minPurchase))}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(coupon)}
                    className="flex-1 gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(coupon.id)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

