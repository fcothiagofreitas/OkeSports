'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import type { CartParticipant } from '@/hooks/useCart';
import { maskPhone, unmaskPhone } from '@/lib/masks';
import { useParticipantAuthStore } from '@/stores/participantAuthStore';
import { User, ChevronRight } from 'lucide-react';


const participantSchema = z.object({
  fullName: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: z
    .string()
    .min(1, 'CPF é obrigatório')
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === 11, { message: 'CPF deve ter 11 dígitos' }),
  email: z.string().email('Email inválido'),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .transform((val) => val.replace(/\D/g, '')),
  birthDate: z.string().min(1, 'Data de nascimento é obrigatória'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'NOT_INFORMED']).optional(),
  shirtSize: z.enum(['PP', 'P', 'M', 'G', 'GG', 'XG'], {
    required_error: 'Tamanho da camisa é obrigatório',
  }),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  medicalInfo: z.string().optional(),
  teamName: z.string().optional(),
});

type ParticipantFormData = z.infer<typeof participantSchema>;

interface AddParticipantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (participant: CartParticipant) => void;
  participant?: CartParticipant | null;
  kitIncludeShirt?: boolean;
  kitShirtRequired?: boolean;
}

const shirtSizes = ['PP', 'P', 'M', 'G', 'GG', 'XG'] as const;

export function AddParticipantModal({
  open,
  onOpenChange,
  onSave,
  participant,
  kitIncludeShirt = false,
  kitShirtRequired = false,
}: AddParticipantModalProps) {
  const isEditing = !!participant;
  const { accessToken } = useParticipantAuthStore();
  const [recentParticipants, setRecentParticipants] = useState<
    Array<{
      id: string;
      fullName: string;
      cpf: string;
      email: string;
      phone: string;
      birthDate: string;
      gender?: string;
      shirtSize?: string | null;
    }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
  } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      fullName: '',
      cpf: '',
      email: '',
      phone: '',
      birthDate: '',
      gender: 'NOT_INFORMED',
      shirtSize: undefined,
      emergencyContact: '',
      emergencyPhone: '',
      medicalInfo: '',
      teamName: '',
    },
  });

  const selectedShirtSize = watch('shirtSize');

  useEffect(() => {
    if (open && !isEditing && accessToken) {
      fetchRecentParticipants();
    }
  }, [open, isEditing, accessToken]);

  const fetchRecentParticipants = async () => {
    try {
      const response = await fetch('/api/participants/recent', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRecentParticipants(data.participants || []);
      }
    } catch (error) {
      console.error('Erro ao buscar participantes recentes:', error);
    }
  };

  const handleSelectParticipant = (selectedParticipant: (typeof recentParticipants)[0]) => {
    reset({
      fullName: selectedParticipant.fullName,
      cpf: selectedParticipant.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
      email: selectedParticipant.email,
      phone: maskPhone(selectedParticipant.phone),
      birthDate: selectedParticipant.birthDate
        ? new Date(selectedParticipant.birthDate).toISOString().split('T')[0]
        : '',
      gender: (selectedParticipant.gender as any) || 'NOT_INFORMED',
      shirtSize: (selectedParticipant.shirtSize as any) || undefined,
      emergencyContact: '',
      emergencyPhone: '',
      medicalInfo: '',
      teamName: '',
    });
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        nameInputRef.current &&
        !nameInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (participant) {
      reset({
        fullName: participant.fullName || '',
        cpf: participant.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '',
        email: participant.email || '',
        phone: maskPhone(participant.phone) || '',
        birthDate: participant.birthDate || '',
        gender: participant.gender || 'NOT_INFORMED',
        shirtSize: participant.shirtSize || undefined,
        emergencyContact: participant.emergencyContact || '',
        emergencyPhone: participant.emergencyPhone ? maskPhone(participant.emergencyPhone) : '',
        medicalInfo: participant.medicalInfo || '',
        teamName: participant.teamName || '',
      });
    } else {
      reset({
        fullName: '',
        cpf: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: 'NOT_INFORMED',
        shirtSize: undefined,
        emergencyContact: '',
        emergencyPhone: '',
        medicalInfo: '',
        teamName: '',
      });
    }
    setShowSuggestions(false);
  }, [participant, reset]);

  const onSubmit = (data: ParticipantFormData) => {
    const participantData: CartParticipant = {
      id: participant?.id || `participant-${Date.now()}`,
      fullName: data.fullName,
      cpf: data.cpf.replace(/\D/g, ''),
      email: data.email.toLowerCase(),
      phone: unmaskPhone(data.phone),
      birthDate: data.birthDate,
      gender: data.gender || 'NOT_INFORMED',
      shirtSize: data.shirtSize,
      emergencyContact: data.emergencyContact,
      emergencyPhone: data.emergencyPhone ? unmaskPhone(data.emergencyPhone) : undefined,
      medicalInfo: data.medicalInfo,
      teamName: data.teamName,
    };
    onSave(participantData);
    onOpenChange(false);
    reset({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Participante' : 'Adicionar Participante'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Atualize os dados abaixo.' : 'Preencha os dados de quem você quer inscrever.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Section: Dados pessoais */}
          <fieldset>
            <legend className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Dados pessoais
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="relative sm:col-span-2">
                <Label htmlFor="fullName" className="text-xs text-slate-600">
                  Nome completo
                </Label>
                <Controller
                  name="fullName"
                  control={control}
                  render={({ field }) => (
                    <>
                      <Input
                        id="fullName"
                        {...field}
                        value={field.value || ''}
                        ref={(e) => {
                          field.ref(e);
                          nameInputRef.current = e;
                        }}
                        onFocus={() => {
                          if (!isEditing && recentParticipants.length > 0) setShowSuggestions(true);
                        }}
                        onChange={(e) => {
                          field.onChange(e);
                          if (!isEditing && recentParticipants.length > 0) setShowSuggestions(true);
                        }}
                        autoComplete="off"
                        placeholder="Nome completo do participante"
                        className="mt-1 rounded-lg"
                      />
                      {showSuggestions && !isEditing && recentParticipants.length > 0 && (
                        <div
                          ref={suggestionsRef}
                          className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
                        >
                          {recentParticipants.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectParticipant(p)}
                              className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-slate-50"
                            >
                              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-slate-100">
                                <User className="h-3.5 w-3.5 text-slate-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900">{p.fullName}</p>
                                <p className="truncate text-xs text-slate-400">{p.email}</p>
                              </div>
                              <ChevronRight className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-slate-300" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                />
                {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
              </div>

              <div>
                <Label htmlFor="cpf" className="text-xs text-slate-600">
                  CPF
                </Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  {...register('cpf')}
                  maxLength={14}
                  className="mt-1 rounded-lg"
                />
                {errors.cpf && <p className="mt-1 text-xs text-red-500">{errors.cpf.message}</p>}
              </div>

              <div>
                <Label htmlFor="email" className="text-xs text-slate-600">
                  Email
                </Label>
                <Input id="email" type="email" {...register('email')} className="mt-1 rounded-lg" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <Label htmlFor="phone" className="text-xs text-slate-600">
                  Telefone
                </Label>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="phone"
                      placeholder="(00) 00000-0000"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      maxLength={15}
                      className="mt-1 rounded-lg"
                    />
                  )}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              <div>
                <Label htmlFor="birthDate" className="text-xs text-slate-600">
                  Data de nascimento
                </Label>
                <Input id="birthDate" type="date" {...register('birthDate')} className="mt-1 rounded-lg" />
                {errors.birthDate && <p className="mt-1 text-xs text-red-500">{errors.birthDate.message}</p>}
              </div>

              <div>
                <Label htmlFor="gender" className="text-xs text-slate-600">
                  Gênero
                </Label>
                <select
                  id="gender"
                  {...register('gender')}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
                >
                  <option value="NOT_INFORMED">Não informar</option>
                  <option value="MALE">Masculino</option>
                  <option value="FEMALE">Feminino</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>

              {/* Shirt size as visual pills */}
              <div className="sm:col-span-2">
                <Label className="text-xs text-slate-600">Tamanho da camisa</Label>
                <input type="hidden" {...register('shirtSize')} />
                <div className="mt-2 flex flex-wrap gap-2">
                  {shirtSizes.map((size) => (
                    <Controller
                      key={size}
                      name="shirtSize"
                      control={control}
                      render={({ field }) => (
                        <button
                          type="button"
                          onClick={() => field.onChange(size)}
                          className={`flex h-10 min-w-[3rem] items-center justify-center rounded-lg border px-3 text-sm font-medium transition-all ${
                            selectedShirtSize === size
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {size}
                        </button>
                      )}
                    />
                  ))}
                </div>
                {errors.shirtSize && <p className="mt-1 text-xs text-red-500">{errors.shirtSize.message}</p>}
              </div>
            </div>
          </fieldset>

          {/* Section: Informações adicionais */}
          <fieldset>
            <legend className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Informações adicionais
            </legend>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="emergencyContact" className="text-xs text-slate-600">
                  Contato de emergência
                </Label>
                <Input
                  id="emergencyContact"
                  placeholder="Nome do contato"
                  {...register('emergencyContact')}
                  className="mt-1 rounded-lg"
                />
              </div>

              <div>
                <Label htmlFor="emergencyPhone" className="text-xs text-slate-600">
                  Tel. emergência
                </Label>
                <Controller
                  name="emergencyPhone"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="emergencyPhone"
                      placeholder="(00) 00000-0000"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(maskPhone(e.target.value))}
                      maxLength={15}
                      className="mt-1 rounded-lg"
                    />
                  )}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="medicalInfo" className="text-xs text-slate-600">
                  Informações médicas
                </Label>
                <Textarea
                  id="medicalInfo"
                  placeholder="Alergias, medicamentos, restrições..."
                  rows={2}
                  {...register('medicalInfo')}
                  className="mt-1 rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="teamName" className="text-xs text-slate-600">
                  Equipe
                </Label>
                <Input
                  id="teamName"
                  placeholder="Nome da equipe (opcional)"
                  {...register('teamName')}
                  className="mt-1 rounded-lg"
                />
              </div>
            </div>
          </fieldset>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-lg"
            >
              Cancelar
            </Button>
            <Button type="submit" className="rounded-lg">
              {isEditing ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
