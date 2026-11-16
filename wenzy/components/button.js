import { cva } from 'class-variance-authority';

export const btn = cva('press inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:opacity-40 disabled:pointer-events-none select-none', {
  variants: {
    intent: { primary: 'bg-black text-white hover:bg-neutral-800', ghost: 'border border-[var(--line)] bg-white hover:bg-neutral-50', danger: 'bg-red-600 text-white hover:bg-red-700', light: 'bg-white text-black hover:bg-neutral-100' },
    size: { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-[15px]', lg: 'px-8 py-4 text-base w-full' },
  },
  defaultVariants: { intent: 'primary', size: 'md' },
});
