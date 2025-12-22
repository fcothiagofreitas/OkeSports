'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiGet, apiPost, ApiError } from '@/lib/api';
import { Loader2, Download, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Registration {
  id: string;
  registrationNumber: number;
  participant: {
    id: string;
    fullName: string;
    email: string;
    cpf: string;
    phone: string;
  };
  modality: {
    id: string;
    name: string;
    price: number;
  };
  basePrice: number;
  discount: number;
  subtotal: number;
  platformFee: number; // Taxa Okê (paga pelo competidor - não exibir ao org)
  mercadoPagoFee: number | null; // Taxa do gateway (paga pelo organizador)
  total: number;
  paymentStatus: 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED';
  paymentMethod: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  shirtSize: string | null;
  coupon: {
    code: string;
    discountType: 'PERCENTAGE' | 'FIXED';
    discountValue: number;
  } | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
}

interface RegistrationsData {
  event: {
    id: string;
    name: string;
  };
  registrations: Registration[];
  total: number;
  summary: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    approved: number;
    totalRevenue: number;
  };
}

interface RegistrationsManagerProps {
  eventId: string;
  accessToken: string;
}

const paymentStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Pendente', variant: 'outline' },
  PROCESSING: { label: 'Processando', variant: 'secondary' },
  APPROVED: { label: 'Aprovado', variant: 'default' },
  REJECTED: { label: 'Rejeitado', variant: 'destructive' },
  CANCELLED: { label: 'Cancelado', variant: 'outline' },
  REFUNDED: { label: 'Reembolsado', variant: 'outline' },
};

const registrationStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Aguardando', variant: 'outline' },
  CONFIRMED: { label: 'Confirmada', variant: 'default' },
  CANCELLED: { label: 'Cancelada', variant: 'destructive' },
};

const paymentMethodLabels: Record<string, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  boleto: 'Boleto',
};

export function RegistrationsManager({ eventId, accessToken }: RegistrationsManagerProps) {
  const [data, setData] = useState<RegistrationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'CONFIRMED' | 'CANCELLED'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');

  useEffect(() => {
    fetchRegistrations();
  }, [eventId, accessToken]);

  const fetchRegistrations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiGet<RegistrationsData>(`/api/events/${eventId}/registrations`);
      setData(response);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Erro ao carregar inscrições');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const exportToCSV = (registrations: Registration[], eventName: string) => {
    // Cabeçalhos
    const headers = [
      'Número',
      'Nome',
      'Email',
      'CPF',
      'Telefone',
      'Modalidade',
      'Preço Base',
      'Desconto',
      'Subtotal',
      'Total Pago',
      'Taxa Mercado Pago',
      'Total Líquido (Org recebe)',
      'Status Inscrição',
      'Status Pagamento',
      'Método Pagamento',
      'Tamanho Camiseta',
      'Cupom',
      'Data Inscrição',
      'Data Confirmação',
    ];

    // Linhas de dados
    const rows = registrations.map((reg) => [
      reg.registrationNumber.toString().padStart(4, '0'),
      reg.participant.fullName,
      reg.participant.email,
      reg.participant.cpf,
      reg.participant.phone,
      reg.modality.name,
      formatCurrency(reg.basePrice),
      formatCurrency(reg.discount),
      formatCurrency(reg.subtotal),
      formatCurrency(reg.total),
      formatCurrency(reg.mercadoPagoFee || 0),
      formatCurrency(reg.total - (reg.mercadoPagoFee || 0)), // Líquido (o que o org recebe)
      registrationStatusLabels[reg.status].label,
      paymentStatusLabels[reg.paymentStatus].label,
      reg.paymentMethod ? (paymentMethodLabels[reg.paymentMethod] || reg.paymentMethod) : '-',
      reg.shirtSize || '-',
      reg.coupon ? `${reg.coupon.code} (${reg.coupon.discountType === 'PERCENTAGE' ? `${reg.coupon.discountValue}%` : formatCurrency(reg.coupon.discountValue)})` : '-',
      formatDate(reg.createdAt),
      reg.confirmedAt ? formatDate(reg.confirmedAt) : '-',
    ]);

    // Criar CSV
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // BOM para Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `inscricoes-${eventName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRegistrations = data?.registrations.filter((reg) => {
    const matchesSearch =
      reg.participant.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.participant.cpf.includes(searchTerm) ||
      reg.registrationNumber.toString().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    const matchesPayment = paymentFilter === 'all' || reg.paymentStatus === paymentFilter;

    return matchesSearch && matchesStatus && matchesPayment;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--accent-pink))]" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchRegistrations}>Tentar novamente</Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[hsl(var(--gray-600))] mb-1">Total de Inscrições</p>
            <p className="text-2xl font-bold text-[hsl(var(--dark))]">{data.summary.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[hsl(var(--gray-600))] mb-1">Confirmadas</p>
            <p className="text-2xl font-bold text-emerald-600">{data.summary.confirmed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[hsl(var(--gray-600))] mb-1">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600">{data.summary.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[hsl(var(--gray-600))] mb-1">Receita Bruta</p>
            <p className="text-2xl font-bold text-[hsl(var(--accent-pink))]">
              {formatCurrency(data.summary.totalRevenue)}
            </p>
            <p className="text-xs text-[hsl(var(--gray-500))] mt-1">
              Líquida:{' '}
              {formatCurrency(
                data.registrations
                  .filter((r) => r.paymentStatus === 'APPROVED')
                  .reduce((sum, r) => {
                    const mpFee = r.mercadoPagoFee ? Number(r.mercadoPagoFee) : 0;
                    return sum + Number(r.subtotal) - mpFee;
                  }, 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Inscrições</CardTitle>
          <CardDescription>Lista completa de inscritos no evento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[hsl(var(--gray-400))]" />
              <Input
                placeholder="Buscar por nome, email, CPF ou número de inscrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-[hsl(var(--gray-300))] rounded-md text-sm"
              >
                <option value="all">Todos os status</option>
                <option value="PENDING">Aguardando</option>
                <option value="CONFIRMED">Confirmadas</option>
                <option value="CANCELLED">Canceladas</option>
              </select>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="px-3 py-2 border border-[hsl(var(--gray-300))] rounded-md text-sm"
              >
                <option value="all">Todos os pagamentos</option>
                <option value="PENDING">Pendente</option>
                <option value="APPROVED">Aprovado</option>
                <option value="REJECTED">Rejeitado</option>
              </select>
            </div>
          </div>

          {/* Lista de inscrições */}
          <div className="space-y-2">
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12 text-[hsl(var(--gray-500))]">
                <p>Nenhuma inscrição encontrada</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[hsl(var(--gray-200))]">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[hsl(var(--gray-700))]">
                        #
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[hsl(var(--gray-700))]">
                        Participante
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[hsl(var(--gray-700))]">
                        Modalidade
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[hsl(var(--gray-700))]">
                        Valor (Líquido)
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[hsl(var(--gray-700))]">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[hsl(var(--gray-700))]">
                        Pagamento
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[hsl(var(--gray-700))]">
                        Data
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrations.map((reg) => (
                      <tr
                        key={reg.id}
                        className="border-b border-[hsl(var(--gray-100))] hover:bg-[hsl(var(--gray-50))]"
                      >
                        <td className="py-3 px-4 text-sm font-mono text-[hsl(var(--gray-600))]">
                          #{reg.registrationNumber.toString().padStart(4, '0')}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-[hsl(var(--dark))]">{reg.participant.fullName}</p>
                            <p className="text-xs text-[hsl(var(--gray-500))]">{reg.participant.email}</p>
                            <p className="text-xs text-[hsl(var(--gray-500))]">{formatCPF(reg.participant.cpf)}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{reg.modality.name}</td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-[hsl(var(--dark))]">
                              {reg.mercadoPagoFee
                                ? formatCurrency(reg.subtotal - reg.mercadoPagoFee)
                                : formatCurrency(reg.subtotal)}
                            </p>
                            <p className="text-xs text-[hsl(var(--gray-500))]">
                              Inscrição: {formatCurrency(reg.subtotal)}
                            </p>
                            {reg.mercadoPagoFee ? (
                              <p className="text-xs text-[hsl(var(--gray-500))]">
                                Taxa MP: {formatCurrency(reg.mercadoPagoFee)}
                              </p>
                            ) : reg.paymentStatus === 'APPROVED' ? (
                              <div className="mt-1">
                                <p className="text-xs text-amber-600 mb-1">
                                  Taxa MP não calculada
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6"
                                  onClick={async () => {
                                    try {
                                      await apiPost(`/api/registrations/${reg.id}/recalculate-fee`);
                                      await fetchRegistrations();
                                    } catch (error) {
                                      console.error('Erro:', error);
                                      alert(
                                        error instanceof ApiError
                                          ? error.message
                                          : 'Erro ao recalcular taxa'
                                      );
                                    }
                                  }}
                                >
                                  Recalcular
                                </Button>
                              </div>
                            ) : (
                              <p className="text-xs text-[hsl(var(--gray-500))]">
                                Aguardando pagamento
                              </p>
                            )}
                            {reg.discount > 0 && (
                              <p className="text-xs text-[hsl(var(--gray-500))] line-through mt-1">
                                Original: {formatCurrency(reg.basePrice)}
                              </p>
                            )}
                            {reg.coupon && (
                              <p className="text-xs text-emerald-600 mt-1">Cupom: {reg.coupon.code}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={registrationStatusLabels[reg.status].variant}>
                            {registrationStatusLabels[reg.status].label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <Badge variant={paymentStatusLabels[reg.paymentStatus].variant}>
                              {paymentStatusLabels[reg.paymentStatus].label}
                            </Badge>
                            {reg.paymentMethod && (
                              <p className="text-xs text-[hsl(var(--gray-500))]">
                                {paymentMethodLabels[reg.paymentMethod] || reg.paymentMethod}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-[hsl(var(--gray-600))]">
                          {formatDate(reg.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Exportar */}
          {filteredRegistrations.length > 0 && (
            <div className="flex justify-end pt-4 border-t border-[hsl(var(--gray-200))]">
              <Button
                variant="outline"
                onClick={() => {
                  exportToCSV(filteredRegistrations, data.event.name);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

