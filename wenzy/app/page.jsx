import { supabase } from '@/lib/supabase';
import { destinationHref } from '@/lib/catalog';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryGrid from '@/components/CategoryGrid';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [{ data: banners }, { data: categories }, { data: collections }, { data: products }] = await Promise.all([
    supabase.from('banners').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('categories').select('id,slug,name,image_path,is_active,is_featured,sort_order').eq('is_active', true).order('sort_order'),
    supabase.from('collections').select('id,slug,name,is_active').eq('is_active', true).order('sort_order'),
    supabase.from('products').select('id,slug,is_active').eq('is_active', true),
  ]);

  const featuredCategory = categories?.find((category) => category.is_featured)
    || categories?.find((category) => /t[- ]?shirts?/i.test(`${category.slug} ${category.name}`));
  const homepageCategory = featuredCategory || {
    id: 't-shirts',
    slug: 't-shirts',
    name: 'T-shirts',
    image_path: null,
  };
  const resolvedBanners = (banners || []).map((banner) => ({
    ...banner,
    cta_href: destinationHref(banner, { products: products || [], categories: categories || [], collections: collections || [] }),
  }));

  return (
    <>
      <HeroCarousel banners={resolvedBanners} />
      <CategoryGrid categories={[homepageCategory]} />
    </>
  );
}
