'use client';
import Link from 'next/link';
import { Drawer } from 'vaul';
import NumberFlow from '@number-flow/react';
import { useCart } from '@/lib/cart';
import { inr } from '@/lib/supabase';
import { btn } from './button';
export default function CartDrawer() {
  const { items, open, setOpen, setQty } = useCart();
  const subtotal = items.reduce((a, i) => a + i.qty * i.price, 0);
  return (
    <Drawer.Root direction="right" open={open} onOpenChange={setOpen}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/30" />
        <Drawer.Content className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-md flex-col bg-[var(--bg)] outline-none">
          <div className="flex items-center justify-between px-6 h-16 border-b border-[var(--line)]">
            <Drawer.Title className="font-semibold tracking-tight">Your bag</Drawer.Title>
            <button onClick={() => setOpen(false)} className="press text-sm text-[var(--muted)]">Close</button>
          </div>
          <Drawer.Description className="sr-only">Items in your shopping bag</Drawer.Description>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 && <p className="text-[var(--muted)] py-16 text-center">Your bag is empty.</p>}
            {items.map((i) => (
              <div key={i.key} className="flex gap-4 py-4 border-b border-[var(--line)]">
                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-neutral-100">{i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}</div>
                <div className="flex-1 text-sm">
                  <p className="font-medium">{i.name}</p>
                  <p className="text-[var(--muted)]">Size {i.size}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <button className="press h-7 w-7 rounded-full border border-[var(--line)]" onClick={() => setQty(i.key, i.qty - 1)} aria-label="Decrease">−</button>
                    <span className="w-4 text-center">{i.qty}</span>
                    <button className="press h-7 w-7 rounded-full border border-[var(--line)]" onClick={() => setQty(i.key, i.qty + 1)} aria-label="Increase">+</button>
                  </div>
                </div>
                <p className="text-sm font-medium">{inr(i.price * i.qty)}</p>
              </div>
            ))}
          </div>
          {items.length > 0 && (
            <div className="border-t border-[var(--line)] px-6 py-5 space-y-4">
              <div className="flex justify-between font-medium"><span>Subtotal</span>
                <NumberFlow value={subtotal} locales="en-IN" format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }} /></div>
              <Link href="/checkout" onClick={() => setOpen(false)} className={btn({ size: 'lg' })}>Checkout</Link>
            </div>
          )}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
