/**
 * Gera um slug amigável para URL a partir de um texto
 * @param text - Texto para converter em slug
 * @returns Slug no formato kebab-case
 * @example
 * generateSlug("Corrida de São Paulo 2025") // "corrida-de-sao-paulo-2025"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Normaliza caracteres especiais
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
    .trim()
    .replace(/\s+/g, '-') // Substitui espaços por hífen
    .replace(/-+/g, '-'); // Remove hífens duplicados
}

/**
 * Gera um slug único adicionando um sufixo numérico se necessário
 * @param baseSlug - Slug base
 * @param existingSlugs - Array de slugs já existentes
 * @returns Slug único
 * @example
 * generateUniqueSlug("corrida-sp", ["corrida-sp"]) // "corrida-sp-2"
 */
export function generateUniqueSlug(
  baseSlug: string,
  existingSlugs: string[]
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}
