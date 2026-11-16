import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
export async function POST(req) {
  const { razorpay_order_id: oid, razorpay_payment_id: pid, razorpay_signature: sig } = await req.json().catch(() => ({}));
  if (!oid || !pid || !sig) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${oid}|${pid}`).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  await db.rpc('finalize_paid_order', { p_razorpay_order_id: oid, p_payment_id: pid });
  const { data } = await db.from('orders').select('order_no').eq('razorpay_order_id', oid).single();
  return NextResponse.json({ orderNo: data?.order_no });
}
