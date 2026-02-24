'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={() => onOpenChange(false)}
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className="w-screen px-0 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ className, children, ...props }: DialogContentProps) {
  return (
    <div
      className={cn(
        'relative z-50 mx-auto w-full max-w-lg rounded-t-2xl border border-slate-200 bg-white p-6 shadow-xl sm:rounded-2xl',
        'max-h-[92vh] overflow-y-auto',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return <div className={cn('mb-5', className)} {...props} />;
}

export function DialogTitle({ className, ...props }: DialogTitleProps) {
  return <h2 className={cn('text-lg font-bold text-slate-900', className)} {...props} />;
}

export function DialogDescription({ className, ...props }: DialogDescriptionProps) {
  return <p className={cn('mt-1 text-sm text-slate-500', className)} {...props} />;
}

export function DialogFooter({ className, ...props }: DialogFooterProps) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)} {...props} />;
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      onClick={onClose}
    >
      <X className="h-4 w-4" />
    </button>
  );
}
