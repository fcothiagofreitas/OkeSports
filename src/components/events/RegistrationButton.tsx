'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useParticipantAuthStore } from '@/stores/participantAuthStore';
import { cn } from '@/lib/utils';

interface RegistrationButtonProps {
  eventSlug: string;
  modalityId: string;
  modalityName: string;
  isDisabled: boolean;
  disabledReason?: string;
  className?: string;
  labelOverride?: string;
}

export function RegistrationButton({
  eventSlug,
  modalityId,
  modalityName,
  isDisabled,
  disabledReason,
  className,
  labelOverride,
}: RegistrationButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useParticipantAuthStore();

  const handleClick = () => {
    if (isDisabled) return;

    // Se não está logado, redireciona para login com redirect
    if (!isAuthenticated) {
      router.push(`/login?redirect=/e/${eventSlug}/inscricao/${modalityId}`);
      return;
    }

    // Redirecionar para formulário de inscrição
    router.push(`/e/${eventSlug}/inscricao/${modalityId}`);
  };

  return (
    <Button className={cn('w-full', className)} disabled={isDisabled} onClick={handleClick}>
      {disabledReason || labelOverride || 'Inscrever-se'}
    </Button>
  );
}
