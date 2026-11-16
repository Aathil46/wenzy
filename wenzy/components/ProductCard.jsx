import Link from 'next/link';
import { coverOf, inr } from '@/lib/supabase';
export default function ProductCard({ p }) {
  const { a, b } = coverOf(p);
  const sold = (p.product_variants || []).length > 0 && p.product_variants.every((v) => v.stock <= 0);
  return (
    <Link href={`/product/${p.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-neutral-100">
        {a && <img src={a} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0" />}
        {(b || a) && <img src={b || a} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-[1.03]" />}
        {sold && <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs">Sold out</span>}
      </div>
      <div className="mt-3 flex justify-between gap-3 text-sm">
        <span className="font-medium">{p.name}</span>
        <span className="shrink-0">{p.compare_at_inr > p.price_inr && <s className="mr-2 text-[var(--muted)]">{inr(p.compare_at_inr)}</s>}{inr(p.price_inr)}</span>
      </div>
    </Link>
  );
}
