import Shop from '@/app/shop/page';

export const dynamic = 'force-dynamic';

export default function CategoryPage({ params }) {
  return <Shop searchParams={{ category: params.slug }} />;
}
