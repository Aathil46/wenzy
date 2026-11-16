export const slugify = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const destinationHref = (banner, destinations = {}) => {
  const { products = [], categories = [], collections = [] } = destinations;
  if (banner.destination_type === 'product') {
    const product = products.find((item) => item.id === banner.destination_id && item.is_active);
    return product ? `/product/${product.slug}` : null;
  }
  if (banner.destination_type === 'category') {
    const category = categories.find((item) => item.id === banner.destination_id && item.is_active);
    return category ? `/category/${category.slug}` : null;
  }
  if (banner.destination_type === 'collection') {
    const collection = collections.find((item) => item.id === banner.destination_id && item.is_active);
    return collection ? `/collection/${collection.slug}` : null;
  }
  if (banner.destination_type === 'shop') return '/shop';
  return banner.cta_href || null;
};
