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
import { Plus, Edit, Trash2, Calendar, Package, Percent, DollarSign } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const batchSchema = z
  .object({
    name: z.string().min(1, 'Nome do lote é obrigatório'),
    type: z.enum(['DATE', 'VOLUME']),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    maxSales: z.preprocess(
      (val) => {
        if (val === '' || val === null || val === undefined) return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      },
      z.number().int().positive().optional()
    ),
    discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    discountValue: z.preprocess(
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
    if (data.type === 'DATE') {
      if (!data.startDate || !data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['startDate'],
          message: 'Datas são obrigatórias para lotes por data',
        });
      } else {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        if (start >= end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['endDate'],
            message: 'Data de fim deve ser depois da data de início',
          });
        }
      }
    } else if (data.type === 'VOLUME') {
      if (!data.maxSales || data.maxSales <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maxSales'],
          message: 'Quantidade máxima é obrigatória para lotes por volume',
        });
      }
    }

    if (data.discountType && !data.discountValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Valor do desconto é obrigatório',
      });
    }

    if (data.discountValue && !data.discountType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountType'],
        message: 'Tipo do desconto é obrigatório',
      });
    }

    if (data.discountType === 'PERCENTAGE' && data.discountValue && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Desconto percentual não pode ser maior que 100%',
      });
    }
  });

type BatchFormData = z.infer<typeof batchSchema>;

interface Batch {
  id: string;
  name: string;
  type: 'DATE' | 'VOLUME';
  startDate?: string | null;
  endDate?: string | null;
  maxSales?: number | null;
  currentSales: number;
  discountType?: 'PERCENTAGE' | 'FIXED' | null;
  discountValue?: number | null;
  active: boolean;
}

interface BatchManagerProps {
  eventId: string;
}

export function BatchManager({ eventId }: BatchManagerProps) {
  const { accessToken } = useAuthStore();
  const [batches, setBatches] = useState<Batch[]>([]);
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
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      active: true,
      type: 'DATE',
    },
  });

  const batchType = watch('type');
  const discountType = watch('discountType');

  useEffect(() => {
    fetchBatches();
  }, [eventId]);

  const fetchBatches = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/batches`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setBatches(data.batches);
      }
    } catch (error) {
      console.error('Erro ao buscar lotes:', error);
    }
  };

  const onSubmit = async (data: BatchFormData) => {
    try {
      setIsLoading(true);

      const url = editingId
        ? `/api/events/${eventId}/batches/${editingId}`
        : `/api/events/${eventId}/batches`;

      const method = editingId ? 'PATCH' : 'POST';

      const payload: Record<string, unknown> = {
        name: data.name,
        type: data.type,
        active: data.active ?? true,
      };

      if (data.type === 'DATE') {
        payload.startDate = data.startDate ? new Date(data.startDate).toISOString() : null;
        payload.endDate = data.endDate ? new Date(data.endDate).toISOString() : null;
      } else {
        payload.maxSales = data.maxSales;
      }

      if (data.discountType && data.discountValue) {
        payload.discountType = data.discountType;
        payload.discountValue = data.discountValue;
      }

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
        throw new Error(result.error || 'Erro ao salvar lote');
      }

      await fetchBatches();
      reset({ active: true, type: 'DATE' });
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (batch: Batch) => {
    setEditingId(batch.id);
    setValue('name', batch.name);
    setValue('type', batch.type);
    setValue('active', batch.active);

    if (batch.type === 'DATE') {
      if (batch.startDate) {
        const startDate = new Date(batch.startDate);
        setValue('startDate', startDate.toISOString().split('T')[0]);
      }
      if (batch.endDate) {
        const endDate = new Date(batch.endDate);
        setValue('endDate', endDate.toISOString().split('T')[0]);
      }
    } else {
      setValue('maxSales', batch.maxSales || undefined);
    }

    if (batch.discountType && batch.discountValue) {
      setValue('discountType', batch.discountType);
      setValue('discountValue', Number(batch.discountValue));
    }

    setShowForm(true);
  };

  const handleDelete = async (batchId: string) => {
    if (!confirm('Tem certeza que deseja deletar este lote?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/batches/${batchId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        await fetchBatches();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao deletar lote');
      }
    } catch (error) {
      console.error('Erro ao deletar lote:', error);
      alert('Erro ao deletar lote');
    }
  };

  const handleCancel = () => {
    reset({ active: true, type: 'DATE' });
    setShowForm(false);
    setEditingId(null);
  };

  const formatDiscount = (type: string | null | undefined, value: number | null | undefined) => {
    if (!type || value === null || value === undefined) return 'Sem desconto';
    if (type === 'PERCENTAGE') return `${value}%`;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-[hsl(var(--dark))]">Lotes</h3>
          <p className="text-sm text-[hsl(var(--gray-600))] mt-1">
            Configure lotes promocionais com descontos automáticos
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Lote
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Lote' : 'Novo Lote'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Lote *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: 1º Lote, Early Bird"
                    {...register('name')}
                    disabled={isLoading}
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Lote *</Label>
                  <Select
                    value={batchType}
                    onValueChange={(value: 'DATE' | 'VOLUME') => {
                      setValue('type', value);
                      if (value === 'VOLUME') {
                        setValue('startDate', undefined);
                        setValue('endDate', undefined);
                      } else {
                        setValue('maxSales', undefined);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DATE">Por Data</SelectItem>
                      <SelectItem value="VOLUME">Por Volume</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
                </div>
              </div>

              {batchType === 'DATE' && (
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
              )}

              {batchType === 'VOLUME' && (
                <div className="space-y-2">
                  <Label htmlFor="maxSales">Quantidade Máxima de Vendas *</Label>
                  <Input
                    id="maxSales"
                    type="number"
                    placeholder="Ex: 100"
                    {...register('maxSales')}
                    disabled={isLoading}
                  />
                  {errors.maxSales && (
                    <p className="text-sm text-red-600">{errors.maxSales.message}</p>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-4">Desconto (Opcional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountType">Tipo de Desconto</Label>
                    <Select
                      value={discountType || ''}
                      onValueChange={(value: 'PERCENTAGE' | 'FIXED' | '') => {
                        if (value === '') {
                          setValue('discountType', undefined);
                          setValue('discountValue', undefined);
                        } else {
                          setValue('discountType', value);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentual (%)</SelectItem>
                        <SelectItem value="FIXED">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {discountType && (
                    <div className="space-y-2">
                      <Label htmlFor="discountValue">
                        {discountType === 'PERCENTAGE' ? 'Percentual (%)' : 'Valor (R$)'} *
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                        placeholder={discountType === 'PERCENTAGE' ? 'Ex: 10' : 'Ex: 20.00'}
                        {...register('discountValue')}
                        disabled={isLoading}
                      />
                      {errors.discountValue && (
                        <p className="text-sm text-red-600">{errors.discountValue.message}</p>
                      )}
                    </div>
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
                  Lote ativo
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Lote'}
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
      {batches.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-[hsl(var(--gray-400))] mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-[hsl(var(--dark))] mb-2">
              Nenhum lote cadastrado
            </h4>
            <p className="text-sm text-[hsl(var(--gray-600))] mb-6">
              Adicione lotes para oferecer descontos automáticos por período ou volume
            </p>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeiro Lote
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map((batch) => (
            <Card key={batch.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{batch.name}</CardTitle>
                  <Badge variant={batch.active ? 'default' : 'secondary'}>
                    {batch.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    {batch.type === 'DATE' ? (
                      <Calendar className="h-4 w-4 text-[hsl(var(--gray-600))]" />
                    ) : (
                      <Package className="h-4 w-4 text-[hsl(var(--gray-600))]" />
                    )}
                    <span className="text-[hsl(var(--gray-600))]">
                      {batch.type === 'DATE'
                        ? `Por Data${batch.startDate && batch.endDate ? `: ${new Date(batch.startDate).toLocaleDateString('pt-BR')} - ${new Date(batch.endDate).toLocaleDateString('pt-BR')}` : ''}`
                        : `Por Volume: ${batch.currentSales} / ${batch.maxSales || '∞'} vendas`}
                    </span>
                  </div>
                  {batch.discountType && batch.discountValue && (
                    <div className="flex items-center gap-2 text-sm">
                      {batch.discountType === 'PERCENTAGE' ? (
                        <Percent className="h-4 w-4 text-green-600" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-green-600" />
                      )}
                      <span className="font-semibold text-green-600">
                        Desconto: {formatDiscount(batch.discountType, batch.discountValue)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(batch)}
                    className="flex-1 gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(batch.id)}
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

