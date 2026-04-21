import { clsx } from 'clsx';
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  LabelHTMLAttributes,
} from 'react';

export function Card({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-slate-200 bg-white p-4 shadow-sm',
        className,
      )}
      {...p}
    />
  );
}

export function Button({
  className,
  variant = 'primary',
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary' && 'bg-brand text-white hover:bg-blue-700',
        variant === 'ghost' && 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100',
        className,
      )}
      {...p}
    />
  );
}

export function Input({ className, ...p }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        'w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand',
        className,
      )}
      {...p}
    />
  );
}

export function Label({ className, ...p }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={clsx('text-sm font-medium text-slate-700', className)} {...p} />;
}
