'use client';
import { useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import NumberFlow from '@number-flow/react';
import { useCart } from '@/lib/cart';
import { inr } from '@/lib/supabase';
import { Button } from '@/components/ui';
export default function ProductClient({ product: p, media, variants }) {
  const [idx, setIdx] = useState(0);
  const [size, setSize] = useState(null);
  const add = useCart((s) => s.add);
  const cur = media[idx];
  const firstImg = media.find((m) => m.type === 'image')?.url;
  const chosen = variants.find((v) => v.size === size);
  const submit = () => {
    if (!size) return toast('Please select a size');
    add({ productId: p.id, slug: p.slug, name: p.name, price: p.price, size, image: firstImg, max: chosen.stock });
    toast.success('Added to your bag');
  };
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-5 pt-10 lg:grid-cols-[1.2fr_1fr]">
      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="aspect-[4/5] overflow-hidden rounded-3xl bg-neutral-100">
          {cur?.type === 'video' ? <video key={cur.url} src={cur.url} className="h-full w-full object-cover" controls autoPlay muted loop playsInline /> : cur && <img src={cur.url} alt={p.name} className="h-full w-full object-cover" />}
        </div>
        {media.length > 1 && (
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {media.map((m, i) => (
              <button key={i} onClick={() => setIdx(i)} className={clsx('press relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2', i === idx ? 'border-black' : 'border-transparent opacity-70')} aria-label={`Show media ${i + 1}`}>
                {m.type === 'video' ? <span className="grid h-full w-full place-items-center bg-neutral-900 text-white text-xs">▶</span> : <img src={m.url} alt="" className="h-full w-full object-cover" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="lg:pt-6">
        <h1 className="h2">{p.name}</h1>
        <p className="mt-3 text-xl">{p.compare > p.price && <s className="mr-3 text-[var(--muted)]">{inr(p.compare)}</s>}<NumberFlow value={p.price} locales="en-IN" format={{ style: 'currency', currency: 'INR', maximumFractionDigits: 0 }} /></p>
        <div className="mt-8">
          <p className="eyebrow mb-3">Size</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button key={v.size} disabled={v.stock <= 0} onClick={() => setSize(v.size)}
                className={clsx('press h-12 min-w-[3.5rem] rounded-full border px-4 text-sm disabled:line-through disabled:opacity-40', size === v.size ? 'border-black bg-black text-white' : 'border-[var(--line)] bg-white')}>{v.size}</button>
            ))}
          </div>
          {chosen && chosen.stock <= 5 && <p className="mt-3 text-sm text-amber-700">Only {chosen.stock} left</p>}
        </div>
        <Button size="lg" className="mt-8" onClick={submit} disabled={variants.every((v) => v.stock <= 0)}>{variants.every((v) => v.stock <= 0) ? 'Sold out' : 'Add to bag'}</Button>
        {p.description && <p className="mt-10 whitespace-pre-line leading-relaxed text-[var(--muted)]">{p.description}</p>}
        {p.details && <div className="mt-8 border-t border-[var(--line)] pt-6"><p className="eyebrow mb-3">Details &amp; care</p><p className="whitespace-pre-line text-sm leading-relaxed text-[var(--muted)]">{p.details}</p></div>}
      </div>
    </div>
  );
}
