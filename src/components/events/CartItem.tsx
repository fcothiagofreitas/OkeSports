'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, X } from 'lucide-react';
import type { CartParticipant } from '@/hooks/useCart';

interface CartItemProps {
  participant: CartParticipant;
  isEditable?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function CartItem({ participant, isEditable = true, onEdit, onRemove, showRemove = true }: CartItemProps) {
  return (
    <Card className="border-neutral-light-gray">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-bold text-neutral-charcoal">{participant.fullName}</h4>
              {participant.id === 'self' && (
                <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                  Você
                </span>
              )}
            </div>
            <div className="space-y-1 text-sm text-neutral-gray">
              <p>
                <span className="font-medium">CPF:</span>{' '}
                {participant.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
              </p>
              <p>
                <span className="font-medium">Email:</span> {participant.email}
              </p>
              {participant.phone && (
                <p>
                  <span className="font-medium">Telefone:</span> {participant.phone}
                </p>
              )}
              <p>
                <span className="font-medium">Camiseta:</span>{' '}
                {participant.shirtSize || <span className="text-neutral-gray italic">Não informado</span>}
              </p>
            </div>
          </div>
          {isEditable && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {showRemove && onRemove && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRemove}
                  className="h-8 w-8 p-0 text-accent-danger hover:text-accent-danger hover:bg-accent-danger/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
