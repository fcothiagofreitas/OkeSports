'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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

export function AddParticipantModal({
  open,
  onOpenChange,
  onSave,
  participant,
  kitIncludeShirt = false,
  kitShirtRequired = false,
}: AddParticipantModalProps) {
  const isEditing = !!participant;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ParticipantFormData>({
    resolver: zodResolver(participantSchema),
  });

  useEffect(() => {
    if (participant) {
      reset({
        fullName: participant.fullName,
        cpf: participant.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4'),
        email: participant.email,
        phone: maskPhone(participant.phone), // Aplicar máscara ao carregar
        birthDate: participant.birthDate,
        gender: participant.gender,
        shirtSize: participant.shirtSize,
        emergencyContact: participant.emergencyContact,
        emergencyPhone: participant.emergencyPhone ? maskPhone(participant.emergencyPhone) : undefined, // Aplicar máscara ao carregar
        medicalInfo: participant.medicalInfo,
        teamName: participant.teamName,
      });
    } else {
      reset({});
    }
  }, [participant, reset]);

  const onSubmit = (data: ParticipantFormData) => {
    const participantData: CartParticipant = {
      id: participant?.id || `participant-${Date.now()}`,
      fullName: data.fullName,
      cpf: data.cpf.replace(/\D/g, ''),
      email: data.email.toLowerCase(),
      phone: unmaskPhone(data.phone), // Remove máscara antes de salvar
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
            {isEditing
              ? 'Edite os dados do participante'
              : 'Preencha os dados da pessoa que você deseja inscrever'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome Completo *</Label>
              <Input id="fullName" {...register('fullName')} />
              {errors.fullName && (
                <p className="text-sm text-accent-danger">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                {...register('cpf')}
                maxLength={14}
              />
              {errors.cpf && <p className="text-sm text-accent-danger">{errors.cpf.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...register('email')} />
              {errors.email && <p className="text-sm text-accent-danger">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                placeholder="(00) 00000-0000"
                {...register('phone', {
                  onChange: (e) => {
                    const masked = maskPhone(e.target.value);
                    e.target.value = masked;
                    // Atualizar valor no react-hook-form
                    register('phone').onChange(e);
                  },
                })}
                maxLength={15}
              />
              {errors.phone && <p className="text-sm text-accent-danger">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de Nascimento *</Label>
              <Input id="birthDate" type="date" {...register('birthDate')} />
              {errors.birthDate && (
                <p className="text-sm text-accent-danger">{errors.birthDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gênero</Label>
              <select
                id="gender"
                {...register('gender')}
                className="w-full px-3 py-2 border border-neutral-light-gray rounded-md bg-neutral-off-white"
              >
                <option value="NOT_INFORMED">Não informar</option>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Feminino</option>
                <option value="OTHER">Outro</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shirtSize">
              Tamanho da Camisa <span className="text-accent-danger ml-1">*</span>
            </Label>
            <select
              id="shirtSize"
              {...register('shirtSize')}
              className="w-full px-3 py-2 border border-neutral-light-gray rounded-md bg-neutral-off-white"
            >
              <option value="">Selecione</option>
              <option value="PP">PP</option>
              <option value="P">P</option>
              <option value="M">M</option>
              <option value="G">G</option>
              <option value="GG">GG</option>
              <option value="XG">XG</option>
            </select>
            {errors.shirtSize && (
              <p className="text-sm text-accent-danger">{errors.shirtSize.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="emergencyContact">Contato de Emergência</Label>
              <Input id="emergencyContact" {...register('emergencyContact')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergencyPhone">Telefone de Emergência</Label>
              <Input
                id="emergencyPhone"
                placeholder="(00) 00000-0000"
                {...register('emergencyPhone', {
                  onChange: (e) => {
                    const masked = maskPhone(e.target.value);
                    e.target.value = masked;
                  },
                })}
                maxLength={15}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalInfo">Informações Médicas</Label>
            <Textarea
              id="medicalInfo"
              placeholder="Alergias, medicamentos, restrições..."
              rows={3}
              {...register('medicalInfo')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamName">Nome da Equipe</Label>
            <Input id="teamName" placeholder="Se for participar em equipe" {...register('teamName')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{isEditing ? 'Salvar Alterações' : 'Adicionar'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
