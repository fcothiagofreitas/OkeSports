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
import { Plus, Edit, Trash2, Package, Shirt, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createKitSchema, type KitItem, type KitSizeStock } from '@/lib/validations/kit';

const kitFormSchema = createKitSchema.extend({
  items: z
    .array(
      z.object({
        name: z.string().min(1, 'Nome do item é obrigatório'),
        included: z.boolean().default(true),
      })
    )
    .optional(),
});

type KitFormData = z.infer<typeof kitFormSchema>;

interface Kit {
  id: string;
  eventId: string;
  items?: KitItem[] | null;
  includeShirt: boolean;
  shirtRequired: boolean;
  sizes: Array<{
    id: string;
    size: string;
    stock: number;
    reserved: number;
    sold: number;
  }>;
}

interface KitManagerProps {
  eventId: string;
}

const SHIRT_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'] as const;

export function KitManager({ eventId }: KitManagerProps) {
  const { accessToken } = useAuthStore();
  const [kit, setKit] = useState<Kit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [items, setItems] = useState<KitItem[]>([]);
  const [sizes, setSizes] = useState<KitSizeStock[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<KitFormData>({
    resolver: zodResolver(kitFormSchema),
    defaultValues: {
      includeShirt: true,
      shirtRequired: false,
    },
  });

  const includeShirt = watch('includeShirt');

  useEffect(() => {
    fetchKit();
  }, [eventId]);

  const fetchKit = async () => {
    try {
      setIsFetching(true);
      const response = await fetch(`/api/events/${eventId}/kit`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.kit) {
        setKit(data.kit);
        setItems((data.kit.items as KitItem[]) || []);
        setSizes(
          data.kit.sizes.map((s: any) => ({
            size: s.size,
            stock: s.stock,
          }))
        );
        setValue('includeShirt', data.kit.includeShirt);
        setValue('shirtRequired', data.kit.shirtRequired);
      } else {
        // Kit não existe ainda, inicializar com valores padrão
        setItems([
          { name: 'Camiseta', included: true },
          { name: 'Medalha', included: true },
        ]);
        setSizes([]);
      }
    } catch (error) {
      console.error('Erro ao buscar kit:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (data: KitFormData) => {
    try {
      setIsLoading(true);

      const payload = {
        items: items.length > 0 ? items : undefined,
        includeShirt: data.includeShirt,
        shirtRequired: data.shirtRequired,
        sizes: sizes.length > 0 ? sizes : undefined,
      };

      const response = await fetch(`/api/events/${eventId}/kit`, {
        method: kit ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao salvar kit');
      }

      await fetchKit();
      alert('Kit salvo com sucesso!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    setItems([...items, { name: '', included: true }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof KitItem, value: string | boolean) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addSize = () => {
    // Adicionar primeiro tamanho disponível que ainda não foi adicionado
    const existingSizes = sizes.map((s) => s.size);
    const availableSize = SHIRT_SIZES.find((size) => !existingSizes.includes(size));
    if (availableSize) {
      setSizes([...sizes, { size: availableSize, stock: 0 }]);
    }
  };

  const removeSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const updateSize = (index: number, field: keyof KitSizeStock, value: string | number) => {
    const newSizes = [...sizes];
    newSizes[index] = { ...newSizes[index], [field]: value };
    setSizes(newSizes);
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[hsl(var(--gray-600))]">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-semibold text-[hsl(var(--dark))]">Kit do Evento</h3>
        <p className="text-sm text-[hsl(var(--gray-600))] mt-1">
          Configure os itens do kit e controle o estoque por tamanho de camiseta
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Configurações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeShirt"
                {...register('includeShirt')}
                disabled={isLoading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="includeShirt" className="cursor-pointer">
                Incluir camiseta no kit
              </Label>
            </div>

            {includeShirt && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shirtRequired"
                  {...register('shirtRequired')}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="shirtRequired" className="cursor-pointer">
                  Tamanho da camiseta é obrigatório na inscrição
                </Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Itens do Kit */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Itens do Kit</CardTitle>
              <Button type="button" onClick={addItem} size="sm" variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8 text-[hsl(var(--gray-600))]">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum item adicionado</p>
                <Button type="button" onClick={addItem} size="sm" variant="outline" className="mt-4">
                  Adicionar Primeiro Item
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Nome do item (ex: Camiseta, Medalha, Mochila)"
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id={`item-${index}-included`}
                        checked={item.included}
                        onChange={(e) => updateItem(index, 'included', e.target.checked)}
                        disabled={isLoading}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor={`item-${index}-included`} className="cursor-pointer text-sm">
                        Incluído
                      </Label>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estoque por Tamanho */}
        {includeShirt && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Estoque por Tamanho</CardTitle>
                <Button type="button" onClick={addSize} size="sm" variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Tamanho
                </Button>
              </div>
              <CardDescription>
                Configure a quantidade disponível de cada tamanho de camiseta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sizes.length === 0 ? (
                <div className="text-center py-8 text-[hsl(var(--gray-600))]">
                  <Shirt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum tamanho configurado</p>
                  <Button type="button" onClick={addSize} size="sm" variant="outline" className="mt-4">
                    Adicionar Primeiro Tamanho
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sizes.map((sizeStock, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="w-24">
                        <Select
                          value={sizeStock.size}
                          onValueChange={(value) => updateSize(index, 'size', value)}
                          disabled={isLoading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SHIRT_SIZES.filter(
                              (size) => !sizes.some((s, i) => s.size === size && i !== index)
                            ).map((size) => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                            {sizes.find((s, i) => s.size === sizeStock.size && i === index) && (
                              <SelectItem value={sizeStock.size}>{sizeStock.size}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`stock-${index}`}>Estoque</Label>
                        <Input
                          id={`stock-${index}`}
                          type="number"
                          min="0"
                          value={sizeStock.stock}
                          onChange={(e) => updateSize(index, 'stock', parseInt(e.target.value) || 0)}
                          disabled={isLoading}
                        />
                      </div>
                      {kit && (
                        <div className="text-sm text-[hsl(var(--gray-600))] space-y-1">
                          <div>Reservado: {kit.sizes.find((s) => s.size === sizeStock.size)?.reserved || 0}</div>
                          <div>Vendido: {kit.sizes.find((s) => s.size === sizeStock.size)?.sold || 0}</div>
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeSize(index)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resumo do Estoque */}
        {kit && includeShirt && kit.sizes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {kit.sizes.map((size) => {
                  const available = size.stock - size.reserved - size.sold;
                  return (
                    <div key={size.id} className="border rounded-lg p-4">
                      <div className="font-semibold text-lg mb-2">{size.size}</div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[hsl(var(--gray-600))]">Estoque:</span>
                          <span>{size.stock}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[hsl(var(--gray-600))]">Reservado:</span>
                          <span className="text-yellow-600">{size.reserved}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[hsl(var(--gray-600))]">Vendido:</span>
                          <span className="text-green-600">{size.sold}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t">
                          <span className="font-semibold">Disponível:</span>
                          <span className={available > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {available}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botões de Ação */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Salvando...' : 'Salvar Kit'}
          </Button>
        </div>
      </form>
    </div>
  );
}

