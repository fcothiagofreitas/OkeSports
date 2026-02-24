'use client';

import { Button } from '@/components/ui/button';
import { Pencil, X, User } from 'lucide-react';
import type { CartParticipant } from '@/hooks/useCart';

interface CartItemProps {
  participant: CartParticipant;
  isEditable?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  showRemove?: boolean;
}

export function CartItem({ participant, isEditable = true, onEdit, onRemove, showRemove = true }: CartItemProps) {
  const isSelf = participant.id === 'self';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
            <User className="h-4 w-4 text-slate-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{participant.fullName}</p>
              {isSelf && (
                <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                  Você
                </span>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
              <span>{participant.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</span>
              <span>{participant.email}</span>
              {participant.shirtSize && <span>Camiseta: {participant.shirtSize}</span>}
              {!participant.shirtSize && (
                <span className="italic text-amber-500">Camiseta pendente</span>
              )}
            </div>
          </div>
        </div>
        {isEditable && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
            {showRemove && onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-8 w-8 p-0 text-slate-400 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
