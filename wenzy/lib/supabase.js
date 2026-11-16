import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
export const mediaUrl = (p) => (p ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/wenzy-media/${p}` : null);
export const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const sortMedia = (p) => [...(p.product_media || [])].sort((a, b) => a.sort_order - b.sort_order);
export const coverOf = (p) => { const m = sortMedia(p).filter((x) => x.media_type === 'image'); return { a: mediaUrl(m[0]?.path), b: mediaUrl(m[1]?.path) }; };
