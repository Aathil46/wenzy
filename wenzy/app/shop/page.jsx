import Link from 'next/link';
import clsx from 'clsx';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
export const dynamic = 'force-dynamic';
export default async function Shop({ searchParams }) {
  const { data: cols } = await supabase.from('collections').select('id,slug,name').eq('is_active', true).order('sort_order');
  const active = cols?.find((c) => c.slug === searchParams.c);
  let q = supabase.from('products').select('*, product_media(path,media_type,sort_order), product_variants(size,stock)').eq('is_active', true).order('created_at', { ascending: false });
  if (active) q = q.eq('collection_id', active.id);
  const { data: products } = await q;
  const pill = (on) => clsx('press rounded-full border px-4 py-2 text-sm whitespace-nowrap', on ? 'bg-black text-white border-black' : 'border-[var(--line)] bg-white');
  return (
    <div className="mx-auto max-w-7xl px-5 pt-14">
      <h1 className="h2">{active ? active.name : 'Shop all'}</h1>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        <Link href="/shop" className={pill(!active)}>All</Link>
        {cols?.map((c) => <Link key={c.id} href={`/shop?c=${c.slug}`} className={pill(active?.id === c.id)}>{c.name}</Link>)}
      </div>
      {products?.length ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      ) : <p className="mt-16 text-[var(--muted)]">Nothing here yet — check back soon.</p>}
    </div>
  );
}
