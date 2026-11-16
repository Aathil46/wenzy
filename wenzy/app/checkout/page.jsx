'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart';
import { inr, supabase } from '@/lib/supabase';
import { FREE_SHIPPING_AT, SHIPPING_FEE } from '@/lib/config';
import { Button } from '@/components/ui';
import { btn } from '@/components/button';
const F = ({ label, ...p }) => <div><label className="label">{label}</label><input className="input" required {...p} /></div>;
export default function Checkout() {
  const { items, clear, setOpen } = useCart();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [f, setF] = useState({ name: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', pin: '' });
  useEffect(() => { setMounted(true); setOpen(false); }, [setOpen]);
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const subtotal = items.reduce((a, i) => a + i.qty * i.price, 0);
  const shipping = subtotal >= FREE_SHIPPING_AT || subtotal === 0 ? 0 : SHIPPING_FEE;
  async function placeOrder(e) {
    e.preventDefault(); setBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const headers = { 'Content-Type': 'application/json' };
      if (sessionData.session?.access_token) headers.Authorization = `Bearer ${sessionData.session.access_token}`;
      const r = await fetch('/api/orders', { method: 'POST', headers, body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, size: i.size, qty: i.qty })), customer: f }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Could not start payment');
      clear(); setDone(d.orderNo);
    } catch (err) { toast.error(err.message); setBusy(false); }
  }
  if (done) return (
    <div className="mx-auto max-w-lg px-5 pt-28 text-center"><h1 className="h2">Thank you.</h1><p className="mt-4 text-[var(--muted)]">Your order #{done} has been received. We will contact you with the next steps.</p><Link href="/shop" className={btn() + ' mt-8'}>Continue shopping</Link></div>
  );
  if (!mounted) return null;
  if (!items.length) return <div className="mx-auto max-w-lg px-5 pt-28 text-center"><h1 className="h2">Your bag is empty</h1><Link href="/shop" className={btn() + ' mt-8'}>Shop now</Link></div>;
  return (
    <form onSubmit={placeOrder} className="mx-auto grid max-w-6xl gap-12 px-5 pt-12 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4">
        <h1 className="h2 mb-4">Checkout</h1>
        <F label="Full name" value={f.name} onChange={on('name')} autoComplete="name" />
        <div className="grid gap-4 sm:grid-cols-2"><F label="Email" type="email" value={f.email} onChange={on('email')} autoComplete="email" /><F label="Phone" type="tel" pattern="[0-9+ ]{10,15}" value={f.phone} onChange={on('phone')} autoComplete="tel" /></div>
        <F label="Address line 1" value={f.line1} onChange={on('line1')} autoComplete="address-line1" />
        <div><label className="label">Address line 2 (optional)</label><input className="input" value={f.line2} onChange={on('line2')} /></div>
        <div className="grid gap-4 sm:grid-cols-3"><F label="City" value={f.city} onChange={on('city')} /><F label="State" value={f.state} onChange={on('state')} /><F label="PIN code" pattern="[0-9]{6}" inputMode="numeric" value={f.pin} onChange={on('pin')} /></div>
      </div>
      <aside className="h-fit rounded-3xl border border-[var(--line)] bg-white p-6 lg:sticky lg:top-28">
        {items.map((i) => <div key={i.key} className="flex justify-between py-2 text-sm"><span>{i.name} · {i.size} × {i.qty}</span><span>{inr(i.price * i.qty)}</span></div>)}
        <div className="mt-3 space-y-2 border-t border-[var(--line)] pt-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
          <div className="flex justify-between"><span>Shipping</span><span>{shipping ? inr(shipping) : 'Free'}</span></div>
          <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{inr(subtotal + shipping)}</span></div>
        </div>
        <Button size="lg" className="mt-6" disabled={busy}>{busy ? 'Placing order…' : 'Place order'}</Button>
        <p className="mt-3 text-center text-xs text-[var(--muted)]">Payment collection will be enabled in a later phase.</p>
      </aside>
    </form>
  );
}
