import Link from 'next/link';
import { supabase, mediaUrl } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';
import { Reveal } from '@/components/ui';
import { btn } from '@/components/button';
const SEL = '*, product_media(path,media_type,sort_order), product_variants(size,stock)';
function BannerMedia({ b, className }) {
  const src = mediaUrl(b.media_path);
  if (!src) return <div className={className + ' bg-gradient-to-br from-neutral-200 to-neutral-400'} />;
  return b.media_type === 'video'
    ? <video className={className} src={src} autoPlay muted loop playsInline />
    : <img className={className} src={src} alt="" />;
}
export default async function Home() {
  const [{ data: banners }, { data: cols }, { data: feat }] = await Promise.all([
    supabase.from('banners').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('collections').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('products').select(SEL).eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(8),
  ]);
  const hero = banners?.[0]; const more = banners?.slice(1) || [];
  return (
    <>
      <section className="relative h-[82vh] min-h-[520px] overflow-hidden bg-neutral-900 text-white">
        {hero ? <BannerMedia b={hero} className="absolute inset-0 h-full w-full object-cover opacity-80" /> : <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-black" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-16 sm:pb-24">
          <Reveal><p className="eyebrow !text-white/70">New season</p></Reveal>
          <Reveal delay={0.05}><h1 className="display mt-3 max-w-3xl">{hero?.headline || 'Dressed with intent.'}</h1></Reveal>
          <Reveal delay={0.1}><p className="mt-4 max-w-md text-white/80">{hero?.subheadline || 'Timeless silhouettes, honest fabrics.'}</p></Reveal>
          <Reveal delay={0.15}><Link href={hero?.cta_href || '/shop'} className={btn({ intent: 'light' }) + ' mt-8'}>{hero?.cta_label || 'Shop now'}</Link></Reveal>
        </div>
      </section>

      {cols?.length > 0 && (
        <section id="collections" className="mx-auto max-w-7xl px-5 pt-24 scroll-mt-24">
          <Reveal><h2 className="h2">Collections</h2></Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cols.map((c, i) => (
              <Reveal key={c.id} delay={i * 0.05}>
                <Link href={`/shop?c=${c.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-neutral-200">
                  {c.cover_path && <img src={mediaUrl(c.cover_path)} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white"><p className="text-2xl font-semibold tracking-tight">{c.name}</p>{c.description && <p className="text-sm text-white/80 line-clamp-2">{c.description}</p>}</div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {feat?.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 pt-24">
          <div className="flex items-end justify-between"><Reveal><h2 className="h2">Featured</h2></Reveal><Link href="/shop" className="text-sm underline underline-offset-4">View all</Link></div>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">{feat.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        </section>
      )}

      {more.map((b) => (
        <section key={b.id} className="mx-auto mt-24 max-w-7xl px-5">
          <div className="relative h-[60vh] min-h-[380px] overflow-hidden rounded-3xl bg-neutral-900 text-white">
            <BannerMedia b={b} className="absolute inset-0 h-full w-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8"><h3 className="h2 max-w-xl">{b.headline}</h3>{b.subheadline && <p className="mt-2 text-white/80">{b.subheadline}</p>}<Link href={b.cta_href || '/shop'} className={btn({ intent: 'light' }) + ' mt-5'}>{b.cta_label}</Link></div>
          </div>
        </section>
      ))}
    </>
  );
}
