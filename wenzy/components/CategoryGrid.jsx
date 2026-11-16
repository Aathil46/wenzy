import Link from 'next/link';
import { mediaUrl } from '@/lib/supabase';

export default function CategoryGrid({ categories }) {
  return (
    <section id="collections" className="mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 sm:py-20">
      <div className="mb-7 flex items-end justify-between border-b border-black/10 pb-4">
        <div>
          <p className="eyebrow">WENZY / SHOP BY</p>
          <h2 className="mt-2 text-2xl font-bold uppercase tracking-[.12em] text-black sm:text-3xl">Categories</h2>
        </div>
        <span className="hidden text-xs uppercase tracking-[.18em] text-black/45 sm:block">01 / {String(categories.length).padStart(2, '0')}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {categories.map((category) => {
          const image = (category.image_path || category.cover_path) ? mediaUrl(category.image_path || category.cover_path) : null;
          return <Link key={category.id} href={category.slug ? `/category/${category.slug}` : '/shop'} className="category-card group relative block aspect-[1.25] overflow-hidden bg-black text-white">
            {image ? <img src={image} alt={category.name} className="category-img absolute inset-0 h-full w-full object-cover" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(255,255,255,.16),transparent_23%),linear-gradient(120deg,#262626,#050505_58%,#737373)]" />}
            <div className="category-overlay absolute inset-0 bg-black/35 transition-opacity duration-300 group-hover:bg-black/50" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 sm:p-7"><div><p className="text-[.62rem] uppercase tracking-[.25em] text-white/70">01 / FEATURED</p><p className="mt-2 text-2xl font-bold uppercase tracking-[-.03em] sm:text-4xl">{category.name}</p></div><span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full border border-white/50 text-xl transition-transform duration-300 group-hover:translate-x-1">→</span></div>
          </Link>;
        })}
      </div>
    </section>
  );
}
