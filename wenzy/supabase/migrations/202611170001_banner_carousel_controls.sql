alter table public.banners
  add column if not exists mobile_media_path text,
  add column if not exists mobile_media_type text default 'image',
  add column if not exists image_position text default 'center center',
  add column if not exists text_position text default 'left bottom',
  add column if not exists autoplay boolean default true,
  add column if not exists autoplay_interval_ms integer default 6500;

alter table public.products
  add column if not exists sku text;

create unique index if not exists products_sku_unique_idx
  on public.products (sku)
  where sku is not null;
