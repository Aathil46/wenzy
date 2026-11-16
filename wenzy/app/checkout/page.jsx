'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart';
import { inr } from '@/lib/supabase';
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
  const loadRzp = () => new Promise((res, rej) => {
    if (window.Razorpay) return res();
    const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = res; s.onerror = rej; document.body.appendChild(s);
  });
  async function pay(e) {
    e.preventDefault(); setBusy(true);
    try {
      await loadRzp();
      const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, size: i.size, qty: i.qty })), customer: f }) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error || 'Could not start payment');
      const rzp = new window.Razorpay({
        key: d.keyId, amount: d.amount, currency: 'INR', name: 'WENZY', description: 'Order payment', order_id: d.razorpayOrderId,
        prefill: { name: f.name, email: f.email, contact: f.phone }, theme: { color: '#111111' },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (resp) => {
          const v = await fetch('/api/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(resp) });
          const vd = await v.json();
          if (v.ok) { clear(); setDone(vd.orderNo); } else toast.error(vd.error || 'Payment could not be verified. Contact us with your payment ID.');
          setBusy(false);
        },
      });
      rzp.on('payment.failed', () => { toast.error('Payment failed. Please try again.'); setBusy(false); });
      rzp.open();
    } catch (err) { toast.error(err.message); setBusy(false); }
  }
  if (done) return (
    <div className="mx-auto max-w-lg px-5 pt-28 text-center"><h1 className="h2">Thank you.</h1><p className="mt-4 text-[var(--muted)]">Your order #{done} is confirmed. A receipt has been sent by Razorpay to your email.</p><Link href="/shop" className={btn() + ' mt-8'}>Continue shopping</Link></div>
  );
  if (!mounted) return null;
  if (!items.length) return <div className="mx-auto max-w-lg px-5 pt-28 text-center"><h1 className="h2">Your bag is empty</h1><Link href="/shop" className={btn() + ' mt-8'}>Shop now</Link></div>;
  return (
    <form onSubmit={pay} className="mx-auto grid max-w-6xl gap-12 px-5 pt-12 lg:grid-cols-[1.2fr_1fr]">
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
        <Button size="lg" className="mt-6" disabled={busy}>{busy ? 'Processing…' : `Pay ${inr(subtotal + shipping)}`}</Button>
        <p className="mt-3 text-center text-xs text-[var(--muted)]">Secure payment by Razorpay · UPI, cards, netbanking</p>
      </aside>
    </form>
  );
}
