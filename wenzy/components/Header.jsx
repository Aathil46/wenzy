'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart';
export default function Header({ logoUrl, brand, announcement }) {
  const count = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0));
  const setOpen = useCart((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <header className="sticky top-0 z-40">
      {announcement && <div className="bg-black text-white text-center text-xs tracking-wide py-2 px-4">{announcement}</div>}
      <div className="glass">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-5 h-16">
          <Link href="/" aria-label={brand} className="flex items-center">
            {logoUrl ? <img src={logoUrl} alt={brand} className="h-8 w-auto" /> : <span className="text-xl font-semibold tracking-[0.28em]">{brand}</span>}
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/shop" className="hover:opacity-60 transition-opacity">Shop</Link>
            <Link href="/#collections" className="hidden sm:block hover:opacity-60 transition-opacity">Collections</Link>
            <button onClick={() => setOpen(true)} className="press relative rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm text-black" aria-label="Open bag">
              Bag{mounted && count > 0 ? ` · ${count}` : ''}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
