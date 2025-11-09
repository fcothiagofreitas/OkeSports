'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useAuthStore } from '@/stores/authStore';
import { Plus, Edit, Trash2, Users, DollarSign, Ticket } from 'lucide-react';

const modalitySchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  price: z.number().min(0, 'Preço deve ser maior ou igual a 0'),
  maxSlots: z.number().int().positive('Vagas deve ser maior que 0').optional(),
  active: z.boolean().optional(),
});

type ModalityFormData = z.infer<typeof modalitySchema>;

interface Modality {
  id: string;
  name: string;
  description?: string;
  price: number;
  maxSlots?: number;
  active: boolean;
  _count: {
    registrations: number;
  };
}

interface ModalityManagerProps {
  eventId: string;
}

export function ModalityManager({ eventId }: ModalityManagerProps) {
  const { accessToken } = useAuthStore();
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [priceValue, setPriceValue] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ModalityFormData>({
    resolver: zodResolver(modalitySchema),
    defaultValues: {
      active: true,
      price: 0,
    },
  });

  useEffect(() => {
    fetchModalities();
  }, [eventId]);

  const fetchModalities = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/modalities`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setModalities(data.modalities);
      }
    } catch (error) {
      console.error('Erro ao buscar modalidades:', error);
    }
  };

  const onSubmit = async (data: ModalityFormData) => {
    try {
      setIsLoading(true);

      const url = editingId
        ? `/api/events/${eventId}/modalities/${editingId}`
        : `/api/events/${eventId}/modalities`;

      const method = editingId ? 'PATCH' : 'POST';

      // Converter preço de centavos para reais antes de enviar
      const payload = {
        ...data,
        price: data.price / 100,
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
        throw new Error(result.error || 'Erro ao salvar modalidade');
      }

      // Atualizar lista
      await fetchModalities();

      // Resetar form
      reset({ active: true, price: 0 });
      setPriceValue(0);
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (modality: Modality) => {
    setEditingId(modality.id);
    setValue('name', modality.name);
    setValue('description', modality.description || '');
    const priceInCents = modality.price * 100; // Converter para centavos
    setValue('price', priceInCents);
    setPriceValue(priceInCents);
    setValue('maxSlots', modality.maxSlots || undefined);
    setValue('active', modality.active);
    setShowForm(true);
  };

  const handleDelete = async (modalityId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta modalidade?')) {
      return;
    }

    try {
      const response = await fetch(`/api/events/${eventId}/modalities/${modalityId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setModalities(modalities.filter((m) => m.id !== modalityId));
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao deletar modalidade');
      }
    } catch (error) {
      console.error('Erro ao deletar modalidade:', error);
      alert('Erro ao deletar modalidade');
    }
  };

  const handleCancel = () => {
    reset({ active: true, price: 0 });
    setPriceValue(0);
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-[hsl(var(--dark))]">Modalidades</h3>
          <p className="text-sm text-[hsl(var(--gray-600))] mt-1">
            Defina as categorias de inscrição do evento
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Editar Modalidade' : 'Nova Modalidade'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Modalidade *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: 5km, 10km, 21km"
                    {...register('name')}
                    disabled={isLoading}
                  />
                  {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Preço *</Label>
                  <CurrencyInput
                    id="price"
                    placeholder="R$ 0,00"
                    value={priceValue}
                    onValueChange={(value) => {
                      setPriceValue(value);
                      setValue('price', value);
                    }}
                    disabled={isLoading}
                  />
                  {errors.price && <p className="text-sm text-red-600">{errors.price.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Detalhes sobre esta modalidade..."
                  rows={3}
                  {...register('description')}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxSlots">Vagas Disponíveis</Label>
                <Input
                  id="maxSlots"
                  type="number"
                  placeholder="Deixe vazio para ilimitado"
                  {...register('maxSlots', { valueAsNumber: true })}
                  disabled={isLoading}
                />
                {errors.maxSlots && (
                  <p className="text-sm text-red-600">{errors.maxSlots.message}</p>
                )}
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
                  Modalidade ativa (disponível para inscrição)
                </Label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Criar Modalidade'}
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
      {modalities.length === 0 && !showForm ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-[hsl(var(--gray-400))] mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-[hsl(var(--dark))] mb-2">
              Nenhuma modalidade cadastrada
            </h4>
            <p className="text-sm text-[hsl(var(--gray-600))] mb-6">
              Adicione modalidades para permitir inscrições no evento
            </p>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Primeira Modalidade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {modalities.map((modality) => (
            <Card key={modality.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{modality.name}</CardTitle>
                  <Badge variant={modality.active ? 'default' : 'secondary'}>
                    {modality.active ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>
                {modality.description && (
                  <CardDescription className="line-clamp-2">{modality.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Ticket className="h-4 w-4 text-[hsl(var(--gray-600))]" />
                    <span className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(modality.price)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[hsl(var(--gray-600))]">
                    <Users className="h-4 w-4" />
                    {modality._count.registrations} inscrições
                    {modality.maxSlots && ` / ${modality.maxSlots} vagas`}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(modality)}
                    className="flex-1 gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(modality.id)}
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
