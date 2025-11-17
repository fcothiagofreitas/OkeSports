'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useParticipantAuthStore } from '@/stores/participantAuthStore';
import { ArrowLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const { login } = useParticipantAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: process.env.NODE_ENV === 'development' ? {
      email: 'thiago@mail.com',
      password: '123456',
    } : undefined,
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/auth/participant/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao fazer login');
      }

      // Fazer login
      login(result.participant, result.accessToken, result.refreshToken);

      // Redirecionar
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push('/minha-conta');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--gray-100))] flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link
            href={redirectTo || '/'}
            className="inline-flex items-center text-sm text-[hsl(var(--gray-600))] hover:text-[hsl(var(--dark))] mb-4 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Link>
          <CardTitle className="text-2xl">Entrar</CardTitle>
          <CardDescription>
            Entre com sua conta para se inscrever em eventos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Credenciais de Teste - DEV ONLY */}
            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-md bg-blue-50 p-3 text-xs border border-blue-200">
                <p className="font-semibold text-blue-900 mb-1">🔧 Acesso de Teste (DEV):</p>
                <p className="text-blue-700">Email: maria@okesports.com</p>
                <p className="text-blue-700">Senha: Senha123</p>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                defaultValue={process.env.NODE_ENV === 'development' ? 'maria@okesports.com' : ''}
                {...register('email')}
                disabled={isLoading}
                autoFocus
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                defaultValue={process.env.NODE_ENV === 'development' ? 'Senha123' : ''}
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            <p className="text-sm text-center text-[hsl(var(--gray-600))]">
              Não tem uma conta?{' '}
              <Link
                href={`/cadastro${redirectTo ? `?redirect=${redirectTo}` : ''}`}
                className="text-[hsl(var(--accent-pink))] hover:underline"
              >
                Criar conta
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
