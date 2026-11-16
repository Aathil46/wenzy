'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase, inr } from '@/lib/supabase';
import { Button } from '@/components/ui';

export default function Account() {
  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    async function loadOrders(nextSession) {
      setOrders(null);
      if (!nextSession?.access_token) return;
      const response = await fetch('/api/account/orders', { headers: { Authorization: `Bearer ${nextSession.access_token}` } });
      const result = await response.json();
      if (response.ok) setOrders(result.orders);
      else toast.error(result.error || 'Could not load your orders.');
    }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); loadOrders(data.session); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); loadOrders(next); });
    return () => data.subscription.unsubscribe();
  }, []);
  async function signIn(event) {
    event.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false); if (error) toast.error(error.message);
  }
  async function reset() {
    if (!email) return toast.error('Enter your email first.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/account` });
    error ? toast.error(error.message) : toast.success('Password reset email sent.');
  }
  if (session === undefined) return null;
  if (session) return <main className="mx-auto max-w-3xl px-5 py-20"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="eyebrow">WENZY / ACCOUNT</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Your account</h1><p className="mt-4 text-[var(--muted)]">Signed in as {session.user.email}</p></div><Button intent="ghost" onClick={() => supabase.auth.signOut()}>Sign out</Button></div><section className="mt-12"><p className="eyebrow">Order history</p>{orders === null && <p className="mt-4 text-[var(--muted)]">Loading orders…</p>}{orders?.length === 0 && <p className="mt-4 text-[var(--muted)]">Your orders will appear here.</p>}{orders?.map((order) => <article key={order.order_no} className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-5"><div className="flex flex-wrap justify-between gap-3"><strong>Order #{order.order_no}</strong><span className="text-sm text-[var(--muted)]">{order.status} · {inr(order.total_inr)}</span></div><p className="mt-2 text-xs text-[var(--muted)]">{new Date(order.created_at).toLocaleDateString('en-IN')}</p><div className="mt-4 space-y-1 text-sm">{order.order_items?.map((item) => <p key={`${order.order_no}-${item.name}-${item.size}`}>{item.name} · {item.size} × {item.quantity}</p>)}</div></article>)}</section></main>;
  return <main className="mx-auto max-w-sm px-5 py-20"><p className="eyebrow">WENZY / ACCOUNT</p><h1 className="mt-3 text-4xl font-semibold tracking-tight">Welcome back.</h1><form onSubmit={signIn} className="mt-8 space-y-4"><div><label className="label">Email</label><input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div><div><label className="label">Password</label><input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div><Button size="lg" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button></form><button type="button" className="mt-5 text-sm text-[var(--muted)] underline" onClick={reset}>Forgot password?</button></main>;
}
