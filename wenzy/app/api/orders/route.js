import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { FREE_SHIPPING_AT, SHIPPING_FEE } from '@/lib/config';

export const dynamic = 'force-dynamic';

const admin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const authClient = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const bad = (error, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req) {
  const { items, customer: customerDetails } = await req.json().catch(() => ({}));
  const customer = customerDetails || {};
  if (!Array.isArray(items) || !items.length || items.length > 30 || !customer.name || !customer.email || !customer.phone || !customer.line1 || !customer.city || !customer.state || !/^\d{6}$/.test(customer.pin || '')) {
    return bad('Please complete all required fields.');
  }

  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  let user = null;
  if (token) {
    const { data } = await authClient().auth.getUser(token);
    user = data.user;
  }

  const db = admin();
  const productIds = [...new Set(items.map((item) => item.productId))];
  const { data: products, error: productError } = await db.from('products').select('id,name,price_inr,is_active,product_variants(size,stock)').in('id', productIds);
  if (productError) return bad('Could not validate the current catalogue.', 500);

  let subtotal = 0;
  const lines = [];
  for (const item of items) {
    const product = products.find((candidate) => candidate.id === item.productId);
    const variant = product?.product_variants.find((candidate) => candidate.size === item.size);
    const quantity = Math.floor(Number(item.qty));
    if (!product || !product.is_active || !variant || quantity < 1) return bad('An item in your bag is no longer available.');
    if (variant.stock < quantity) return bad(`${product.name} (${item.size}) — only ${variant.stock} left.`);
    subtotal += product.price_inr * quantity;
    lines.push({ name: product.name, product_id: product.id, size: item.size, unit_price_inr: product.price_inr, quantity });
  }

  const shipping = subtotal >= FREE_SHIPPING_AT ? 0 : SHIPPING_FEE;
  const { data: order, error: orderError } = await db.from('orders').insert({
    customer_id: user?.id || null,
    customer_name: customer.name.trim(),
    customer_email: customer.email.trim().toLowerCase(),
    customer_phone: customer.phone.trim(),
    shipping_address: { line1: customer.line1.trim(), line2: customer.line2?.trim() || '', city: customer.city.trim(), state: customer.state.trim(), pin: customer.pin },
    subtotal_inr: subtotal,
    shipping_inr: shipping,
    total_inr: subtotal + shipping,
    status: 'pending',
  }).select('id,order_no').single();
  if (orderError) return bad('Could not create your order intent.', 500);

  const { error: itemError } = await db.from('order_items').insert(lines.map((line) => ({ ...line, order_id: order.id })));
  if (itemError) {
    await db.from('orders').delete().eq('id', order.id);
    return bad('Could not save your order items.', 500);
  }

  return NextResponse.json({ orderNo: order.order_no });
}
