alter table public.products
  add column if not exists sku text,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists status text default 'published';

alter table public.orders
  add column if not exists customer_id uuid references auth.users(id);

alter table public.banners
  add column if not exists mobile_media_path text,
  add column if not exists mobile_media_type text default 'image',
  add column if not exists image_position text default 'center center',
  add column if not exists text_position text default 'left bottom',
  add column if not exists destination_type text default 'none',
  add column if not exists destination_id uuid;

create unique index if not exists products_sku_unique_idx
  on public.products (sku)
  where sku is not null;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_categories (
  product_id uuid not null references public.products(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists public.collection_products (
  collection_id uuid not null references public.collections(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (collection_id, product_id)
);

create index if not exists product_categories_category_idx
  on public.product_categories (category_id);

create index if not exists collection_products_product_idx
  on public.collection_products (product_id);

create index if not exists banners_destination_idx
  on public.banners (destination_type, destination_id);

insert into public.collection_products (collection_id, product_id)
select collection_id, id
from public.products
where collection_id is not null
on conflict do nothing;

alter table public.categories enable row level security;
alter table public.product_categories enable row level security;
alter table public.collection_products enable row level security;

do $$
begin
  if to_regprocedure('public.is_admin()') is not null then
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'categories' and policyname = 'published categories are readable') then
      execute 'create policy "published categories are readable" on public.categories for select using (is_active = true)';
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'categories' and policyname = 'admins manage categories') then
      execute 'create policy "admins manage categories" on public.categories for all using (public.is_admin()) with check (public.is_admin())';
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_categories' and policyname = 'published product categories are readable') then
      execute 'create policy "published product categories are readable" on public.product_categories for select using (exists (select 1 from public.categories c where c.id = category_id and c.is_active = true))';
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_categories' and policyname = 'admins manage product categories') then
      execute 'create policy "admins manage product categories" on public.product_categories for all using (public.is_admin()) with check (public.is_admin())';
    end if;

    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_products' and policyname = 'published collection products are readable') then
      execute 'create policy "published collection products are readable" on public.collection_products for select using (exists (select 1 from public.collections c where c.id = collection_id and c.is_active = true))';
    end if;
    if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'collection_products' and policyname = 'admins manage collection products') then
      execute 'create policy "admins manage collection products" on public.collection_products for all using (public.is_admin()) with check (public.is_admin())';
    end if;
  end if;
end
$$;
