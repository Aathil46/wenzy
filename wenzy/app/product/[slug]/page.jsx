import { notFound } from 'next/navigation';
import { supabase, mediaUrl, sortMedia } from '@/lib/supabase';
import ProductClient from './ProductClient';
export const dynamic = 'force-dynamic';
export default async function ProductPage({ params }) {
  const { data: p } = await supabase.from('products').select('*, product_media(*), product_variants(*)').eq('slug', params.slug).eq('is_active', true).single();
  if (!p) notFound();
  const media = sortMedia(p).map((m) => ({ type: m.media_type, url: mediaUrl(m.path) }));
  const order = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
  const variants = [...p.product_variants].sort((a, b) => (order.indexOf(a.size) + 99) % 99 - (order.indexOf(b.size) + 99) % 99);
  return <ProductClient product={{ id: p.id, slug: p.slug, name: p.name, price: p.price_inr, compare: p.compare_at_inr, description: p.description, details: p.details }} media={media} variants={variants.map((v) => ({ size: v.size, stock: v.stock }))} />;
}
