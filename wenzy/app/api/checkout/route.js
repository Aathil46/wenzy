import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { FREE_SHIPPING_AT, SHIPPING_FEE } from '@/lib/config';
export const dynamic = 'force-dynamic';
const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const bad = (error, status = 400) => NextResponse.json({ error }, { status });
export async function POST(req) {
  const { items, customer: c } = await req.json().catch(() => ({}));
  if (!Array.isArray(items) || !items.length || items.length > 30 || !c?.name || !c?.email || !c?.phone || !c?.line1 || !c?.city || !c?.state || !/^\d{6}$/.test(c?.pin || '')) return bad('Please complete all required fields.');
  const db = admin();
  const { data: prods } = await db.from('products').select('id,name,price_inr,is_active,product_variants(size,stock)').in('id', [...new Set(items.map((i) => i.productId))]);
  let subtotal = 0; const lines = [];
  for (const i of items) {
    const p = prods?.find((x) => x.id === i.productId); const v = p?.product_variants.find((x) => x.size === i.size); const q = Math.floor(Number(i.qty));
    if (!p || !p.is_active || !v || !(q >= 1)) return bad('An item in your bag is no longer available.');
    if (v.stock < q) return bad(`${p.name} (${i.size}) — only ${v.stock} left.`);
    subtotal += p.price_inr * q; lines.push({ product_id: p.id, name: p.name, size: i.size, unit_price_inr: p.price_inr, quantity: q });
  }
  const shipping = subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE; const total = subtotal + shipping;
  const { data: order, error } = await db.from('orders').insert({
    customer_name: c.name, customer_email: c.email, customer_phone: c.phone,
    shipping_address: { line1: c.line1, line2: c.line2 || '', city: c.city, state: c.state, pin: c.pin },
    subtotal_inr: subtotal, shipping_inr: shipping, total_inr: total,
  }).select().single();
  if (error) return bad('Could not create order.', 500);
  await db.from('order_items').insert(lines.map((l) => ({ ...l, order_id: order.id })));
  const rz = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64') },
    body: JSON.stringify({ amount: total * 100, currency: 'INR', receipt: String(order.order_no) }),
  });
  const r = await rz.json();
  if (!rz.ok) return bad('Payment provider error. Please try again.', 502);
  await db.from('orders').update({ razorpay_order_id: r.id }).eq('id', order.id);
  return NextResponse.json({ keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, razorpayOrderId: r.id, amount: r.amount });
}
