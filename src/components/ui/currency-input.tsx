'use client';

import * as React from 'react';
import { Input } from './input';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string | number;
  onChange?: (value: string) => void;
  onValueChange?: (numericValue: number) => void;
}

/**
 * Formata número para moeda brasileira (R$)
 * @param value - Valor numérico em centavos
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100);
}

/**
 * Remove formatação e retorna valor em centavos
 * @param formatted - String formatada (ex: "R$ 1.234,56")
 * @returns Valor numérico em centavos (ex: 123456)
 */
export function parseCurrency(formatted: string): number {
  // Remove tudo exceto números
  const numbers = formatted.replace(/\D/g, '');
  return parseInt(numbers || '0', 10);
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    // Inicializar com valor formatado
    React.useEffect(() => {
      if (value === undefined || value === null || value === '') {
        setDisplayValue('R$ 0,00');
        return;
      }

      const numericValue = typeof value === 'string' ? parseCurrency(value) : value;
      setDisplayValue(formatCurrency(numericValue));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const numericValue = parseCurrency(inputValue);
      const formatted = formatCurrency(numericValue);

      setDisplayValue(formatted);

      // Callback com valor formatado
      if (onChange) {
        onChange(formatted);
      }

      // Callback com valor numérico (em centavos)
      if (onValueChange) {
        onValueChange(numericValue);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      // Seleciona tudo ao focar
      e.target.select();
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    return (
      <Input
        {...props}
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        inputMode="numeric"
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
