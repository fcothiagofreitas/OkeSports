'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getAllPhosphorIcons, getIconByKey } from '@/constants/landingIcons';
import { cn } from '@/lib/utils';
import { Search, X } from 'lucide-react';

interface IconSelectorProps {
  value?: string;
  onChange: (iconKey: string) => void;
  onClear?: () => void;
}

export function IconSelector({ value, onChange, onClear }: IconSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const allIcons = useMemo(() => getAllPhosphorIcons(), []);
  
  const filteredIcons = useMemo(() => {
    if (!searchTerm.trim()) {
      return allIcons.slice(0, 100); // Limitar a 100 ícones inicialmente
    }
    
    const term = searchTerm.toLowerCase();
    return allIcons.filter(
      (icon) =>
        icon.name.toLowerCase().includes(term) ||
        icon.key.toLowerCase().includes(term)
    );
  }, [allIcons, searchTerm]);

  const SelectedIcon = value ? getIconByKey(value) : null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="w-full h-11 justify-center">
          {SelectedIcon ? (
            <SelectedIcon className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
          ) : (
            <span className="text-xs uppercase tracking-[0.3em] text-[hsl(var(--gray-500))]">
              Selecionar ícone
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 rounded-3xl border border-[hsl(var(--gray-100))] bg-white/95 backdrop-blur shadow-xl p-4"
        align="start"
      >
        <div className="space-y-3">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--gray-400))]" />
            <Input
              type="text"
              placeholder="Buscar ícone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9 h-9"
              autoFocus
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--gray-400))] hover:text-[hsl(var(--gray-600))]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Grid de ícones */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredIcons.length === 0 ? (
              <div className="text-center py-8 text-sm text-[hsl(var(--gray-500))]">
                Nenhum ícone encontrado
              </div>
            ) : (
              <div className="grid grid-cols-6 gap-2">
                {filteredIcons.map((iconOption) => {
                  const IconComponent = iconOption.icon;
                  const isSelected = iconOption.key === value;
                  return (
                    <button
                      key={iconOption.key}
                      type="button"
                      className={cn(
                        'flex h-10 w-full items-center justify-center rounded-lg border transition hover:scale-105',
                        isSelected
                          ? 'border-[hsl(var(--accent-pink))] bg-[hsl(var(--accent-pink))]/10'
                          : 'border-[hsl(var(--gray-200))] hover:border-[hsl(var(--accent-pink))]'
                      )}
                      onClick={() => {
                        onChange(iconOption.key);
                        setIsOpen(false);
                        setSearchTerm('');
                      }}
                      title={iconOption.name}
                    >
                      <IconComponent
                        className={cn(
                          'h-5 w-5 flex-shrink-0',
                          isSelected
                            ? 'text-[hsl(var(--accent-pink))]'
                            : 'text-[hsl(var(--gray-500))]'
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mostrar total de resultados */}
          {searchTerm && (
            <div className="text-xs text-center text-[hsl(var(--gray-500))] pt-2 border-t border-[hsl(var(--gray-200))]">
              {filteredIcons.length} ícone{filteredIcons.length !== 1 ? 's' : ''} encontrado
              {filteredIcons.length !== 1 ? 's' : ''}
            </div>
          )}

          {/* Botão para remover ícone */}
          {value && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (onClear) onClear();
                  setIsOpen(false);
                }}
                className="justify-center text-red-600 focus:text-red-600"
              >
                Remover ícone
              </DropdownMenuItem>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

