import Shop from '@/app/shop/page';

export const dynamic = 'force-dynamic';

export default function CollectionPage({ params }) {
  return <Shop searchParams={{ collection: params.slug }} />;
}
