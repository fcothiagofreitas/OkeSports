'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useParticipantAuthStore } from '@/stores/participantAuthStore';

interface RegistrationButtonProps {
  eventSlug: string;
  modalityId: string;
  modalityName: string;
  isDisabled: boolean;
  disabledReason?: string;
}

export function RegistrationButton({
  eventSlug,
  modalityId,
  modalityName,
  isDisabled,
  disabledReason,
}: RegistrationButtonProps) {
  const router = useRouter();
  const { isAuthenticated } = useParticipantAuthStore();

  const handleClick = () => {
    if (isDisabled) return;

    // Se não está logado, redireciona para login com redirect
    if (!isAuthenticated) {
      router.push(`/login?redirect=/e/${eventSlug}`);
      return;
    }

    // TODO: Abrir modal/página de checkout
    alert(`TODO: Checkout para ${modalityName}`);
  };

  return (
    <Button
      className="w-full"
      disabled={isDisabled}
      onClick={handleClick}
    >
      {disabledReason || 'Inscrever-se'}
    </Button>
  );
}
