/**
 * Utilitário para gerenciar participantes salvos (localStorage)
 * Salva automaticamente pessoas cadastradas para reutilização
 */

export interface SavedParticipant {
  id: string;
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  gender?: string;
  shirtSize?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalInfo?: string;
  teamName?: string;
  savedAt: string; // ISO date
}

const STORAGE_KEY = 'okesports_saved_participants';

/**
 * Salva um participante no localStorage
 * Se já existir (por CPF), atualiza os dados
 */
export function saveParticipant(participant: Omit<SavedParticipant, 'id' | 'savedAt'>): void {
  if (typeof window === 'undefined') return;

  try {
    const saved = getSavedParticipants();
    const existingIndex = saved.findIndex((p) => p.cpf === participant.cpf);

    const participantToSave: SavedParticipant = {
      id: existingIndex >= 0 ? saved[existingIndex].id : `saved_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...participant,
      savedAt: existingIndex >= 0 ? saved[existingIndex].savedAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Atualizar existente
      saved[existingIndex] = participantToSave;
    } else {
      // Adicionar novo
      saved.push(participantToSave);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch (error) {
    console.error('Erro ao salvar participante:', error);
  }
}

/**
 * Salva múltiplos participantes de uma vez (após checkout)
 */
export function saveParticipants(participants: Omit<SavedParticipant, 'id' | 'savedAt'>[]): void {
  participants.forEach((p) => saveParticipant(p));
}

/**
 * Busca todos os participantes salvos
 */
export function getSavedParticipants(): SavedParticipant[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as SavedParticipant[];
  } catch (error) {
    console.error('Erro ao buscar participantes salvos:', error);
    return [];
  }
}

/**
 * Busca um participante por CPF
 */
export function getParticipantByCpf(cpf: string): SavedParticipant | undefined {
  const normalizedCpf = cpf.replace(/\D/g, '');
  return getSavedParticipants().find((p) => p.cpf.replace(/\D/g, '') === normalizedCpf);
}

/**
 * Busca participantes por nome (para autocomplete)
 */
export function searchParticipantsByName(query: string): SavedParticipant[] {
  if (!query.trim()) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  return getSavedParticipants().filter((p) =>
    p.fullName.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Remove um participante salvo
 */
export function removeSavedParticipant(cpf: string): void {
  if (typeof window === 'undefined') return;

  try {
    const saved = getSavedParticipants();
    const normalizedCpf = cpf.replace(/\D/g, '');
    const filtered = saved.filter((p) => p.cpf.replace(/\D/g, '') !== normalizedCpf);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Erro ao remover participante:', error);
  }
}
