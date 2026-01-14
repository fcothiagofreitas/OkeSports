import { useState, useCallback } from 'react';

export interface CartParticipant {
  id: string; // UUID temporário
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'NOT_INFORMED';
  shirtSize?: 'PP' | 'P' | 'M' | 'G' | 'GG' | 'XG';
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalInfo?: string;
  teamName?: string;
}

export interface CartState {
  items: CartParticipant[];
  couponCode?: string;
}

export function useCart(initialParticipant?: CartParticipant) {
  const [cart, setCart] = useState<CartState>({
    items: initialParticipant ? [initialParticipant] : [],
  });

  const addParticipant = useCallback((participant: CartParticipant) => {
    setCart((prev) => ({
      ...prev,
      items: [...prev.items, participant],
    }));
  }, []);

  const updateParticipant = useCallback((id: string, updates: Partial<CartParticipant>) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    }));
  }, []);

  const removeParticipant = useCallback((id: string) => {
    setCart((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  }, []);

  const setCouponCode = useCallback((code: string | undefined) => {
    setCart((prev) => ({
      ...prev,
      couponCode: code,
    }));
  }, []);

  const clearCart = useCallback(() => {
    setCart({ items: [] });
  }, []);

  return {
    cart,
    addParticipant,
    updateParticipant,
    removeParticipant,
    setCouponCode,
    clearCart,
    itemCount: cart.items.length,
  };
}
