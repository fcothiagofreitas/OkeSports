import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Participant {
  id: string;
  email: string;
  fullName: string;
  cpf: string;
  phone: string;
}

interface ParticipantAuthState {
  participant: Participant | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  login: (participant: Participant, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateParticipant: (participant: Partial<Participant>) => void;
}

export const useParticipantAuthStore = create<ParticipantAuthState>()(
  persist(
    (set) => ({
      participant: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (participant, accessToken, refreshToken) => {
        set({
          participant,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          participant: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      updateParticipant: (updatedData) => {
        set((state) => ({
          participant: state.participant
            ? { ...state.participant, ...updatedData }
            : null,
        }));
      },
    }),
    {
      name: 'participant-auth-storage', // Nome diferente do organizador
    }
  )
);
