import Link from 'next/link';
import clsx from 'clsx';
import { supabase } from '@/lib/supabase';
import ProductCard from '@/components/ProductCard';

export const dynamic = 'force-dynamic';

export default async function Shop({ searchParams = {} }) {
  const [{ data: categories }, { data: collections }] = await Promise.all([
    supabase.from('categories').select('id,slug,name').eq('is_active', true).order('sort_order'),
    supabase.from('collections').select('id,slug,name').eq('is_active', true).order('sort_order'),
  ]);
  const category = categories?.find((item) => item.slug === searchParams.category);
  const collection = collections?.find((item) => item.slug === searchParams.collection);
  const search = (searchParams.search || '').trim();
  const sort = searchParams.sort === 'price-asc' ? { column: 'price_inr', ascending: true } : { column: 'created_at', ascending: false };
  let productIds = null;
  if (category) {
    const { data } = await supabase.from('product_categories').select('product_id').eq('category_id', category.id);
    productIds = (data || []).map((item) => item.product_id);
  } else if (collection) {
    const { data } = await supabase.from('collection_products').select('product_id').eq('collection_id', collection.id).order('sort_order');
    productIds = (data || []).map((item) => item.product_id);
  }
  let query = supabase.from('products').select('*, product_media(path,media_type,sort_order), product_variants(size,stock)').eq('is_active', true).order(sort.column, { ascending: sort.ascending });
  if (productIds) query = productIds.length ? query.in('id', productIds) : query.eq('id', '00000000-0000-0000-0000-000000000000');
  if (search) query = query.ilike('name', `%${search}%`);
  const { data: products } = await query;
  const active = category || collection;
  const pill = (on) => clsx('press rounded-full border px-4 py-2 text-sm whitespace-nowrap', on ? 'bg-black text-white border-black' : 'border-[var(--line)] bg-white');

  return (
    <div className="mx-auto max-w-7xl px-5 pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">WENZY / CATALOGUE</p>
          <h1 className="h2 mt-2">{search ? `Search: ${search}` : active ? active.name : 'Shop all'}</h1>
        </div>
        <form className="flex gap-2" action="/shop">
          <input name="search" defaultValue={search} className="input !w-44" placeholder="Search products" aria-label="Search products" />
          <button type="submit" className="press rounded-full bg-black px-4 py-2 text-sm text-white">Search</button>
        </form>
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
        <Link href="/shop" className={pill(!active)}>All</Link>
        {categories?.map((item) => <Link key={item.id} href={`/shop?category=${item.slug}`} className={pill(category?.id === item.id)}>{item.name}</Link>)}
        {collections?.map((item) => <Link key={item.id} href={`/shop?collection=${item.slug}`} className={pill(collection?.id === item.id)}>{item.name}</Link>)}
        <Link href={`/shop${active ? `?${category ? `category=${category.slug}` : `collection=${collection.slug}`}&sort=price-asc` : '?sort=price-asc'}`} className={pill(searchParams.sort === 'price-asc')}>Price low to high</Link>
      </div>
      {products?.length ? (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} p={product} />)}</div>
      ) : <p className="mt-16 text-[var(--muted)]">Nothing here yet — check back soon.</p>}
    </div>
  );
}
