/**
 * Resposta da API ViaCEP (https://viacep.com.br)
 */
export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export interface AddressFromCep {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
}

/**
 * Busca endereço pelo CEP usando a API ViaCEP.
 * @param cep - CEP com ou sem hífen (8 dígitos)
 * @returns Dados do endereço ou null se CEP inválido/não encontrado
 */
export async function fetchAddressByCep(cep: string): Promise<AddressFromCep | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data: ViaCepResponse = await res.json();
    if (data.erro) return null;
    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade || '',
      state: (data.uf || '').toUpperCase(),
    };
  } catch {
    return null;
  }
}
