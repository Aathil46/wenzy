'use client';
import { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { supabase, mediaUrl, inr } from '@/lib/supabase';
import { ADMIN_EMAIL } from '@/lib/config';
import { slugify } from '@/lib/catalog';
import { Button } from '@/components/ui';

const BUCKET = 'wenzy-media';
async function upload(file, folder) {
  const ext = file.name.split('.').pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: '31536000', contentType: file.type });
  if (error) throw error;
  return path;
}
function verifyImageUrl(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = setTimeout(() => { image.src = ''; reject(new Error('The uploaded logo could not be verified publicly.')); }, 10000);
    image.onload = () => { clearTimeout(timeout); resolve(); };
    image.onerror = () => { clearTimeout(timeout); reject(new Error('The uploaded logo could not be loaded from public storage.')); };
    image.src = url;
  });
}
const Field = ({ label, children, className }) => <div className={className}><label className="label">{label}</label>{children}</div>;
const Card = ({ children, className }) => <div className={clsx('rounded-2xl border border-[var(--line)] bg-white p-5', className)}>{children}</div>;
const Thumb = ({ path, type }) => path ? (type === 'video' ? <video src={mediaUrl(path)} className="h-full w-full object-cover" muted /> : <img src={mediaUrl(path)} alt="" className="h-full w-full object-cover" />) : <div className="h-full w-full bg-neutral-100" />;

export default function Admin() {
  const [session, setSession] = useState(undefined);
  const [recovery, setRecovery] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((e, s) => { setSession(s); if (e === 'PASSWORD_RECOVERY') setRecovery(true); });
    return () => data.subscription.unsubscribe();
  }, []);
  if (session === undefined) return null;
  if (recovery) return <SetPassword done={() => setRecovery(false)} />;
  if (!session) return <Login />;
  if (session.user.email !== ADMIN_EMAIL) return <Center><p>This account does not have admin access.</p><Button className="mt-4" onClick={() => supabase.auth.signOut()}>Sign out</Button></Center>;
  return <Dashboard />;
}
const Center = ({ children }) => <div className="mx-auto max-w-sm px-5 pt-28 text-center">{children}</div>;

function Login() {
  const [email, setEmail] = useState(ADMIN_EMAIL); const [pw, setPw] = useState(''); const [busy, setBusy] = useState(false);
  async function go(e) { e.preventDefault(); setBusy(true); const { error } = await supabase.auth.signInWithPassword({ email, password: pw }); setBusy(false); if (error) toast.error(error.message); }
  async function reset() { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin + '/admin' }); error ? toast.error(error.message) : toast.success('Password reset email sent'); }
  return (
    <form onSubmit={go} className="mx-auto max-w-sm space-y-4 px-5 pt-24">
      <h1 className="h2">Admin sign in</h1>
      <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
      <Field label="Password"><input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required /></Field>
      <Button size="lg" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
      <button type="button" onClick={reset} className="block w-full text-center text-sm text-[var(--muted)] underline">Forgot password / first-time setup</button>
    </form>
  );
}
function SetPassword({ done }) {
  const [pw, setPw] = useState('');
  async function go(e) { e.preventDefault(); const { error } = await supabase.auth.updateUser({ password: pw }); if (error) return toast.error(error.message); toast.success('Password updated'); done(); }
  return <form onSubmit={go} className="mx-auto max-w-sm space-y-4 px-5 pt-24"><h1 className="h2">Set a new password</h1><input className="input" type="password" minLength={10} placeholder="At least 10 characters" value={pw} onChange={(e) => setPw(e.target.value)} required /><Button size="lg">Save password</Button></form>;
}

function Dashboard() {
  const [tab, setTab] = useState('Overview');
  const tabs = ['Overview', 'Orders', 'Products', 'Categories', 'Collections', 'Banners', 'Settings'];
  return (
    <div className="mx-auto max-w-6xl px-5 pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="h2">Store admin</h1>
        <Button intent="ghost" size="sm" onClick={() => supabase.auth.signOut()}>Sign out</Button>
      </div>
      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-[var(--line)] pb-3">
        {tabs.map((t) => <button key={t} onClick={() => setTab(t)} className={clsx('press rounded-full px-4 py-2 text-sm whitespace-nowrap', tab === t ? 'bg-black text-white' : 'hover:bg-neutral-100')}>{t}</button>)}
      </div>
      <div className="mt-8">
        {tab === 'Overview' && <Overview onViewOrders={() => setTab('Orders')} />}
        {tab === 'Orders' && <Orders />}
        {tab === 'Products' && <Products />}
        {tab === 'Categories' && <Categories />}
        {tab === 'Collections' && <Crud key="c" table="collections" noun="collection" titleKey="name" thumbKey="cover_path" slugFrom="name" fields={[{ k: 'name', l: 'Name' }, { k: 'description', l: 'Description', t: 'area' }, { k: 'cover_path', l: 'Cover image', t: 'media', folder: 'collections' }, { k: 'sort_order', l: 'Display order', t: 'num' }, { k: 'is_active', l: 'Visible on site', t: 'check' }]} />}
        {tab === 'Banners' && <Crud key="b" table="banners" noun="banner" titleKey="headline" thumbKey="media_path" mediaKeys={['media_path', 'mobile_media_path']} typeKey="media_type" fields={[{ k: 'headline', l: 'Headline' }, { k: 'subheadline', l: 'Subheadline' }, { k: 'cta_label', l: 'Button label' }, { k: 'destination_type', l: 'Destination type', t: 'destination-type' }, { k: 'destination_id', l: 'Destination', t: 'destination' }, { k: 'media_path', l: 'Desktop image or video', t: 'media', folder: 'banners' }, { k: 'mobile_media_path', l: 'Mobile image (optional)', t: 'media', folder: 'banners', typeKey: 'mobile_media_type' }, { k: 'image_position', l: 'Image position (e.g. center center)' }, { k: 'text_position', l: 'Text position (e.g. left bottom)' }, { k: 'sort_order', l: 'Order (lowest = first)', t: 'num' }, { k: 'is_active', l: 'Published on site', t: 'check' }]} />}
        {tab === 'Settings' && <Settings />}
      </div>
    </div>
  );
}

function Overview({ onViewOrders }) {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    Promise.all([
      supabase.from('orders').select('id,order_no,customer_name,total_inr,status,created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('products').select('id,is_active'),
      supabase.from('categories').select('id,is_active'),
    ]).then(([orders, products, categories]) => {
      const allOrders = orders.data || [];
      const paid = allOrders.filter((order) => ['paid', 'packed', 'shipped', 'delivered'].includes(order.status));
      setSummary({ orders: allOrders, revenue: paid.reduce((total, order) => total + Number(order.total_inr || 0), 0), products: products.data || [], categories: categories.data || [] });
    });
  }, []);
  if (!summary) return <p className="text-[var(--muted)]">Loading overview…</p>;
  const stats = [
    ['Revenue', inr(summary.revenue)],
    ['Orders', summary.orders.length],
    ['Published products', summary.products.filter((product) => product.is_active).length],
    ['Visible categories', summary.categories.filter((category) => category.is_active).length],
  ];
  return <div className="space-y-8">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label, value]) => <Card key={label}><p className="eyebrow">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></Card>)}</div>
    <Card><div className="flex items-center justify-between"><div><p className="eyebrow">Latest activity</p><h2 className="mt-1 text-xl font-semibold">Recent orders</h2></div><button className="text-sm underline" onClick={onViewOrders}>View all</button></div><div className="mt-5 divide-y divide-[var(--line)]">{summary.orders.length ? summary.orders.map((order) => <div key={order.id} className="flex items-center justify-between gap-4 py-3 text-sm"><span><b>#{order.order_no}</b> · {order.customer_name}</span><span className="text-[var(--muted)]">{order.status} · {inr(order.total_inr)}</span></div>) : <p className="py-4 text-sm text-[var(--muted)]">No orders yet.</p>}</div></Card>
  </div>;
}

/* ---------- Orders ---------- */
const STATUSES = ['pending', 'paid', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded'];
function Orders() {
  const [rows, setRows] = useState(null); const [open, setOpen] = useState(null); const [filter, setFilter] = useState('all');
  const load = useCallback(async () => { const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false }).limit(200); setRows(data || []); }, []);
  useEffect(() => { load(); }, [load]);
  async function patch(id, v) { const { error } = await supabase.from('orders').update(v).eq('id', id); error ? toast.error(error.message) : (toast.success('Order updated'), load()); }
  if (!rows) return <p className="text-[var(--muted)]">Loading…</p>;
  const paid = rows.filter((r) => ['paid', 'packed', 'shipped', 'delivered'].includes(r.status));
  const shown = filter === 'all' ? rows : rows.filter((r) => r.status === filter);
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><p className="eyebrow">Revenue</p><p className="mt-1 text-2xl font-semibold">{inr(paid.reduce((a, r) => a + r.total_inr, 0))}</p></Card>
        <Card><p className="eyebrow">Paid orders</p><p className="mt-1 text-2xl font-semibold">{paid.length}</p></Card>
        <Card><p className="eyebrow">To pack</p><p className="mt-1 text-2xl font-semibold">{rows.filter((r) => r.status === 'paid').length}</p></Card>
      </div>
      <select className="input !w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
      {shown.length === 0 && <p className="text-[var(--muted)]">No orders yet.</p>}
      {shown.map((o) => (
        <Card key={o.id}>
          <button className="flex w-full items-center justify-between text-left" onClick={() => setOpen(open === o.id ? null : o.id)}>
            <span><b>#{o.order_no}</b> · {o.customer_name} <span className="text-[var(--muted)]">· {new Date(o.created_at).toLocaleDateString('en-IN')}</span></span>
            <span className="flex items-center gap-3"><span className="rounded-full bg-neutral-100 px-3 py-1 text-xs">{o.status}</span><b>{inr(o.total_inr)}</b></span>
          </button>
          {open === o.id && (
            <div className="mt-4 grid gap-6 border-t border-[var(--line)] pt-4 text-sm md:grid-cols-2">
              <div className="space-y-1">
                {o.order_items.map((i) => <p key={i.id}>{i.name} · {i.size} × {i.quantity} — {inr(i.unit_price_inr * i.quantity)}</p>)}
                <p className="pt-2 text-[var(--muted)]">Shipping {inr(o.shipping_inr)}</p>
                {o.razorpay_payment_id && <p className="text-xs text-[var(--muted)]">Payment: {o.razorpay_payment_id}</p>}
              </div>
              <div className="space-y-3">
                <p>{o.customer_email} · {o.customer_phone}<br />{o.shipping_address.line1} {o.shipping_address.line2}<br />{o.shipping_address.city}, {o.shipping_address.state} {o.shipping_address.pin}</p>
                <select className="input" value={o.status} onChange={(e) => patch(o.id, { status: e.target.value })}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                <input className="input" placeholder="Tracking note (courier + ID)" defaultValue={o.tracking_note || ''} onBlur={(e) => e.target.value !== (o.tracking_note || '') && patch(o.id, { tracking_note: e.target.value })} />
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function Categories() {
  return <Crud key="categories" table="categories" noun="category" titleKey="name" thumbKey="image_path" slugFrom="name" fields={[
    { k: 'name', l: 'Name' },
    { k: 'slug', l: 'URL slug' },
    { k: 'description', l: 'Description', t: 'area' },
    { k: 'image_path', l: 'Category image', t: 'media', folder: 'categories' },
    { k: 'sort_order', l: 'Display order', t: 'num' },
    { k: 'is_active', l: 'Published on site', t: 'check' },
    { k: 'is_featured', l: 'Featured on homepage', t: 'check' },
    { k: 'seo_title', l: 'SEO title' },
    { k: 'seo_description', l: 'SEO description', t: 'area' },
  ]} />;
}

/* ---------- Products ---------- */
const blank = { name: '', slug: '', sku: '', price_inr: '', compare_at_inr: '', collection_id: '', description: '', details: '', seo_title: '', seo_description: '', is_active: true, is_featured: false };
function Products() {
  const [list, setList] = useState(null); const [cols, setCols] = useState([]); const [categories, setCategories] = useState([]); const [edit, setEdit] = useState(null);
  const load = useCallback(async () => {
    const [{ data: p }, { data: c }, { data: cats }] = await Promise.all([
      supabase.from('products').select('*, product_media(*), product_variants(*), product_categories(category_id)').order('created_at', { ascending: false }),
      supabase.from('collections').select('id,name').order('sort_order'),
      supabase.from('categories').select('id,name').order('sort_order'),
    ]);
    setList(p || []); setCols(c || []); setCategories(cats || []);
  }, []);
  useEffect(() => { load(); }, [load]);
  async function del(p) {
    if (!confirm(`Delete "${p.name}" permanently?`)) return;
    const paths = p.product_media.map((m) => m.path);
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) return toast.error(error.message);
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    toast.success('Product deleted'); load();
  }
  if (edit) return <ProductEditor initial={edit} cols={cols} categories={categories} onClose={(reload) => { setEdit(null); reload && load(); }} />;
  if (!list) return <p className="text-[var(--muted)]">Loading…</p>;
  return (
    <div className="space-y-3">
      <Button onClick={() => setEdit({ ...blank, category_ids: [], collection_ids: [], sizes: ['S', 'M', 'L', 'XL'].map((s) => ({ size: s, stock: 0 })), media: [] })}>+ Add product</Button>
      {list.map((p) => {
        const m = [...p.product_media].sort((a, b) => a.sort_order - b.sort_order)[0];
        return (
          <Card key={p.id} className="flex items-center gap-4">
            <div className="h-20 w-16 shrink-0 overflow-hidden rounded-xl"><Thumb path={m?.path} type={m?.media_type} /></div>
            <div className="flex-1 text-sm"><p className="font-medium">{p.name} {!p.is_active && <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs">Hidden</span>}</p><p className="text-[var(--muted)]">{inr(p.price_inr)} · stock {p.product_variants.reduce((a, v) => a + v.stock, 0)}</p></div>
            <Button intent="ghost" size="sm" onClick={() => setEdit({ ...p, price_inr: p.price_inr, compare_at_inr: p.compare_at_inr ?? '', collection_id: p.collection_id || '', category_ids: (p.product_categories || []).map((item) => item.category_id), collection_ids: p.collection_id ? [p.collection_id] : [], description: p.description || '', details: p.details || '', sizes: p.product_variants.map((v) => ({ size: v.size, stock: v.stock })), media: [...p.product_media].sort((a, b) => a.sort_order - b.sort_order) })}>Edit</Button>
            <Button intent="danger" size="sm" onClick={() => del(p)}>Delete</Button>
          </Card>
        );
      })}
      {list.length === 0 && <p className="text-[var(--muted)]">No products yet.</p>}
    </div>
  );
}

function ProductEditor({ initial, cols, categories, onClose }) {
  const [f, setF] = useState(initial); const [busy, setBusy] = useState(false); const [removed, setRemoved] = useState([]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  async function addFiles(e) {
    const files = [...e.target.files]; setBusy(true);
    try { const up = []; for (const file of files) up.push({ path: await upload(file, 'products'), media_type: file.type.startsWith('video') ? 'video' : 'image' }); setF((s) => ({ ...s, media: [...s.media, ...up] })); }
    catch (err) { toast.error(err.message); } finally { setBusy(false); e.target.value = ''; }
  }
  const move = (i, d) => { const m = [...f.media]; const j = i + d; if (j < 0 || j >= m.length) return; [m[i], m[j]] = [m[j], m[i]]; setF({ ...f, media: m }); };
  const drop = (i) => { const m = f.media[i]; if (m.id) setRemoved((r) => [...r, m]); else supabase.storage.from(BUCKET).remove([m.path]); setF({ ...f, media: f.media.filter((_, k) => k !== i) }); };
  async function save() {
    if (!f.name.trim() || f.price_inr === '') return toast.error('Name and price are required');
    setBusy(true);
    try {
      const selectedCollections = f.collection_ids || (f.collection_id ? [f.collection_id] : []);
      const row = { name: f.name.trim(), slug: slugify(f.slug || f.name), sku: String(f.sku || '').trim().toUpperCase() || null, price_inr: parseInt(f.price_inr, 10), compare_at_inr: f.compare_at_inr === '' ? null : parseInt(f.compare_at_inr, 10), collection_id: selectedCollections[0] || null, description: f.description, details: f.details, seo_title: f.seo_title || null, seo_description: f.seo_description || null, is_active: f.is_active, is_featured: f.is_featured, updated_at: new Date().toISOString() };
      const q = f.id ? supabase.from('products').update(row).eq('id', f.id) : supabase.from('products').insert(row);
      const { data: p, error } = await q.select().single(); if (error) throw error;
      const categoryRows = (f.category_ids || []).map((category_id) => ({ product_id: p.id, category_id }));
      const categoryDelete = await supabase.from('product_categories').delete().eq('product_id', p.id);
      if (categoryDelete.error) throw categoryDelete.error;
      if (categoryRows.length) { const result = await supabase.from('product_categories').insert(categoryRows); if (result.error) throw result.error; }
      const collectionDelete = await supabase.from('collection_products').delete().eq('product_id', p.id);
      if (collectionDelete.error) throw collectionDelete.error;
      const collectionRows = selectedCollections.map((collection_id, sort_order) => ({ product_id: p.id, collection_id, sort_order }));
      if (collectionRows.length) { const result = await supabase.from('collection_products').insert(collectionRows); if (result.error) throw result.error; }
      const keep = f.sizes.filter((s) => s.size.trim()).map((s) => ({ product_id: p.id, size: s.size.trim().toUpperCase(), stock: Math.max(0, parseInt(s.stock, 10) || 0) }));
      if (keep.length) { const r = await supabase.from('product_variants').upsert(keep, { onConflict: 'product_id,size' }); if (r.error) throw r.error; }
      const { data: ex } = await supabase.from('product_variants').select('id,size').eq('product_id', p.id);
      const gone = (ex || []).filter((e) => !keep.find((k) => k.size === e.size)).map((e) => e.id);
      if (gone.length) await supabase.from('product_variants').delete().in('id', gone);
      if (removed.length) { await supabase.from('product_media').delete().in('id', removed.map((m) => m.id)); await supabase.storage.from(BUCKET).remove(removed.map((m) => m.path)); }
      await Promise.all(f.media.map((m, i) => m.id ? supabase.from('product_media').update({ sort_order: i }).eq('id', m.id) : supabase.from('product_media').insert({ product_id: p.id, path: m.path, media_type: m.media_type, sort_order: i })));
      toast.success('Product saved'); onClose(true);
    } catch (err) { toast.error(err.message); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-6">
      <button className="text-sm underline" onClick={() => onClose(false)}>← Back to products</button>
      <h2 className="h2">{f.id ? 'Edit product' : 'New product'}</h2>
      <Card className="grid gap-4 sm:grid-cols-2">
        <Field label="Name"><input className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="URL slug (auto if empty)"><input className="input" value={f.slug} onChange={set('slug')} /></Field>
        <Field label="SKU"><input className="input" value={f.sku || ''} onChange={set('sku')} /></Field>
        <Field label="Price (₹)"><input className="input" type="number" min="0" value={f.price_inr} onChange={set('price_inr')} /></Field>
        <Field label="Original price (₹, optional — shows strike-through)"><input className="input" type="number" min="0" value={f.compare_at_inr} onChange={set('compare_at_inr')} /></Field>
        <Field label="Collection"><select className="input" value={f.collection_id} onChange={set('collection_id')}><option value="">None</option>{cols.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Categories"><select multiple className="input min-h-28" value={f.category_ids || []} onChange={(e) => setF({ ...f, category_ids: [...e.target.selectedOptions].map((option) => option.value) })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
        <Field label="Collections"><select multiple className="input min-h-28" value={f.collection_ids || (f.collection_id ? [f.collection_id] : [])} onChange={(e) => setF({ ...f, collection_ids: [...e.target.selectedOptions].map((option) => option.value), collection_id: e.target.selectedOptions[0]?.value || '' })}>{cols.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <div className="flex items-end gap-6 pb-2 text-sm"><label className="flex gap-2"><input type="checkbox" checked={f.is_active} onChange={set('is_active')} /> Visible</label><label className="flex gap-2"><input type="checkbox" checked={f.is_featured} onChange={set('is_featured')} /> Featured on homepage</label></div>
        <Field label="Description" className="sm:col-span-2"><textarea className="input" rows={4} value={f.description} onChange={set('description')} /></Field>
        <Field label="Details & care" className="sm:col-span-2"><textarea className="input" rows={3} value={f.details} onChange={set('details')} /></Field>
        <Field label="SEO title"><input className="input" value={f.seo_title || ''} onChange={set('seo_title')} /></Field>
        <Field label="SEO description"><textarea className="input" rows={2} value={f.seo_description || ''} onChange={set('seo_description')} /></Field>
      </Card>
      <Card>
        <p className="font-medium">Sizes &amp; stock</p>
        <div className="mt-3 space-y-2">
          {f.sizes.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input className="input !w-28" placeholder="Size" value={s.size} onChange={(e) => setF({ ...f, sizes: f.sizes.map((x, k) => k === i ? { ...x, size: e.target.value } : x) })} />
              <input className="input !w-28" type="number" min="0" placeholder="Stock" value={s.stock} onChange={(e) => setF({ ...f, sizes: f.sizes.map((x, k) => k === i ? { ...x, stock: e.target.value } : x) })} />
              <Button intent="ghost" size="sm" onClick={() => setF({ ...f, sizes: f.sizes.filter((_, k) => k !== i) })}>Remove</Button>
            </div>
          ))}
        </div>
        <Button intent="ghost" size="sm" className="mt-3" onClick={() => setF({ ...f, sizes: [...f.sizes, { size: '', stock: 0 }] })}>+ Add size</Button>
      </Card>
      <Card>
        <p className="font-medium">Images &amp; videos <span className="font-normal text-[var(--muted)]">— first image is the cover</span></p>
        <div className="mt-3 flex flex-wrap gap-3">
          {f.media.map((m, i) => (
            <div key={m.path} className="w-28">
              <div className="h-36 overflow-hidden rounded-xl"><Thumb path={m.path} type={m.media_type} /></div>
              <div className="mt-1 flex justify-between text-xs"><button onClick={() => move(i, -1)}>←</button><button onClick={() => drop(i)} className="text-red-600">Delete</button><button onClick={() => move(i, 1)}>→</button></div>
            </div>
          ))}
        </div>
        <input className="mt-4 text-sm" type="file" multiple accept="image/*,video/*" onChange={addFiles} disabled={busy} />
      </Card>
      <Button onClick={save} disabled={busy}>{busy ? 'Working…' : 'Save product'}</Button>
    </div>
  );
}

/* ---------- Generic CRUD (collections, banners) ---------- */
function Crud({ table, noun, fields, titleKey, thumbKey, mediaKeys = [], typeKey, slugFrom }) {
  const [rows, setRows] = useState(null); const [edit, setEdit] = useState(null); const [busy, setBusy] = useState(false);
  const [destinations, setDestinations] = useState({ products: [], categories: [], collections: [] });
  const load = useCallback(async () => { const { data } = await supabase.from(table).select('*').order('sort_order'); setRows(data || []); }, [table]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (table !== 'banners') return;
    Promise.all([
      supabase.from('products').select('id,name').eq('is_active', true).order('name'),
      supabase.from('categories').select('id,name').eq('is_active', true).order('name'),
      supabase.from('collections').select('id,name').eq('is_active', true).order('name'),
    ]).then(([products, categories, collections]) => setDestinations({ products: products.data || [], categories: categories.data || [], collections: collections.data || [] }));
  }, [table]);
  const blankRow = () => Object.fromEntries(fields.map((x) => [x.k, x.t === 'check' ? true : x.t === 'num' ? 0 : '']));
  async function save() {
    setBusy(true);
    const { id, created_at, ...rest } = edit; const row = { ...rest };
    if (slugFrom) row.slug = slugify(rest.slug || rest[slugFrom] || '');
    for (const x of fields) if (x.t === 'num') row[x.k] = parseInt(row[x.k], 10) || 0;
    const { error } = id ? await supabase.from(table).update(row).eq('id', id) : await supabase.from(table).insert(row);
    setBusy(false); if (error) return toast.error(error.message);
    toast.success('Saved'); setEdit(null); load();
  }
  async function del(r) {
    if (!confirm(`Delete this ${noun}?`)) return;
    if (table === 'categories') {
      const [{ data: productLinks }, { data: bannerLinks }] = await Promise.all([
        supabase.from('product_categories').select('product_id').eq('category_id', r.id),
        supabase.from('banners').select('id').eq('destination_type', 'category').eq('destination_id', r.id),
      ]);
      if (productLinks?.length || bannerLinks?.length) {
        const choice = window.prompt(`This category is used by ${productLinks?.length || 0} product(s) and ${bannerLinks?.length || 0} banner(s). Type "remove" to clear those links, "reassign" to move products, or Cancel.`);
        if (choice === 'reassign' && productLinks.length) {
          const targets = rows.filter((item) => item.id !== r.id).map((item) => `${item.id}: ${item.name}`).join('\n');
          const targetId = window.prompt(`Enter the destination category ID:\n${targets}`);
          if (!targetId || !rows.some((item) => item.id === targetId && item.id !== r.id)) return toast.error('A valid destination category is required.');
          const result = await supabase.from('product_categories').update({ category_id: targetId }).eq('category_id', r.id);
          if (result.error) return toast.error(result.error.message);
          if (bannerLinks.length) {
            const bannerResult = await supabase.from('banners').update({ destination_type: 'none', destination_id: null }).eq('destination_type', 'category').eq('destination_id', r.id);
            if (bannerResult.error) return toast.error(bannerResult.error.message);
          }
        } else if (choice === 'remove') {
          const productResult = await supabase.from('product_categories').delete().eq('category_id', r.id);
          const bannerResult = await supabase.from('banners').update({ destination_type: 'none', destination_id: null }).eq('destination_type', 'category').eq('destination_id', r.id);
          if (productResult.error || bannerResult.error) return toast.error((productResult.error || bannerResult.error).message);
        } else {
          return;
        }
      }
    }
    const { error } = await supabase.from(table).delete().eq('id', r.id); if (error) return toast.error(error.message);
    const paths = [...new Set([thumbKey, ...mediaKeys].map((key) => key && r[key]).filter(Boolean))];
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    load();
  }
  async function pick(x, e) {
    const file = e.target.files[0]; if (!file) return; setBusy(true);
    try { const path = await upload(file, x.folder); const mediaTypeKey = x.typeKey || typeKey; setEdit((s) => ({ ...s, [x.k]: path, ...(mediaTypeKey ? { [mediaTypeKey]: file.type.startsWith('video') ? 'video' : 'image' } : {}) })); } catch (err) { toast.error(err.message); }
    setBusy(false);
  }
  if (edit) return (
    <div className="space-y-4 max-w-xl">
      <button className="text-sm underline" onClick={() => setEdit(null)}>← Back</button>
      {table === 'banners' && <div className="relative aspect-[16/7] overflow-hidden rounded-2xl bg-neutral-900 text-white">
        {edit.media_path ? <Thumb path={edit.media_path} type={edit.media_type} /> : <div className="h-full w-full bg-[radial-gradient(circle_at_75%_25%,rgba(255,255,255,.16),transparent_28%),linear-gradient(120deg,#262626,#050505_58%,#737373)]" />}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-5"><p className="text-[.6rem] uppercase tracking-[.25em] text-white/70">Preview</p><p className="mt-2 text-2xl font-semibold uppercase leading-none">{edit.headline || 'WEAR YOUR EDGE.'}</p>{edit.cta_label && <span className="mt-3 w-fit rounded-full bg-white px-3 py-1 text-xs text-black">{edit.cta_label}</span>}</div>
      </div>}
      {fields.map((x) => (
        <Field key={x.k} label={x.l}>
          {x.t === 'check' ? <input type="checkbox" checked={!!edit[x.k]} onChange={(e) => setEdit({ ...edit, [x.k]: e.target.checked })} />
            : x.t === 'area' ? <textarea className="input" rows={3} value={edit[x.k] || ''} onChange={(e) => setEdit({ ...edit, [x.k]: e.target.value })} />
            : x.t === 'destination-type' ? <select className="input" value={edit[x.k] || 'none'} onChange={(e) => setEdit({ ...edit, [x.k]: e.target.value, destination_id: '' })}><option value="none">None</option><option value="shop">Shop</option><option value="product">Product</option><option value="category">Category</option><option value="collection">Collection</option></select>
            : x.t === 'destination' ? <select className="input" value={edit.destination_id || ''} disabled={!edit.destination_type || edit.destination_type === 'none' || edit.destination_type === 'shop'} onChange={(e) => setEdit({ ...edit, destination_id: e.target.value })}><option value="">{edit.destination_type === 'shop' ? 'Shop page' : 'Select destination'}</option>{(destinations[`${edit.destination_type}s`] || []).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
            : x.t === 'media' ? <div className="space-y-2">{edit[x.k] && <div className="h-40 w-32 overflow-hidden rounded-xl"><Thumb path={edit[x.k]} type={typeKey && edit[typeKey]} /></div>}<input type="file" accept={typeKey ? 'image/*,video/*' : 'image/*'} onChange={(e) => pick(x, e)} className="text-sm" /></div>
            : <input className="input" type={x.t === 'num' ? 'number' : 'text'} value={edit[x.k] ?? ''} onChange={(e) => setEdit({ ...edit, [x.k]: e.target.value })} />}
        </Field>
      ))}
      <Button onClick={save} disabled={busy}>{busy ? 'Working…' : 'Save'}</Button>
    </div>
  );
  if (!rows) return <p className="text-[var(--muted)]">Loading…</p>;
  return (
    <div className="space-y-3">
      <Button onClick={() => setEdit(blankRow())}>+ Add {noun}</Button>
      {rows.map((r) => (
        <Card key={r.id} className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl"><Thumb path={r[thumbKey]} type={typeKey && r[typeKey]} /></div>
          <p className="flex-1 font-medium">{r[titleKey]} {!r.is_active && <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-normal">Hidden</span>}</p>
          <Button intent="ghost" size="sm" onClick={() => setEdit(r)}>Edit</Button>
          <Button intent="danger" size="sm" onClick={() => del(r)}>Delete</Button>
        </Card>
      ))}
      {rows.length === 0 && <p className="text-[var(--muted)]">Nothing here yet.</p>}
    </div>
  );
}

/* ---------- Settings / logo ---------- */
function Settings() {
  const [s, setS] = useState(null); const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.from('site_settings').select('*').eq('id', 1).single().then(({ data }) => setS(data)); }, []);
  async function logo(e) {
    const file = e.target.files[0]; if (!file) return; setBusy(true);
    let path = null; let committed = false;
    try {
      path = await upload(file, 'brand');
      await verifyImageUrl(mediaUrl(path));
      const { data: updated, error } = await supabase.from('site_settings').update({ logo_path: path }).eq('id', 1).select('id,logo_path').single();
      if (error) throw error;
      if (!updated?.logo_path) throw new Error('The logo setting was not updated.');
      committed = true;
      const old = s.logo_path;
      let cleanupError = null;
      if (old && old !== path) ({ error: cleanupError } = await supabase.storage.from(BUCKET).remove([old]));
      setS({ ...s, logo_path: path });
      cleanupError ? toast.success('Logo updated; the previous file needs cleanup.') : toast.success('Logo updated');
    } catch (err) {
      if (path && !committed) {
        const { error: cleanupError } = await supabase.storage.from(BUCKET).remove([path]);
        if (cleanupError) err.message += ` The new upload could not be cleaned up: ${cleanupError.message}`;
      }
      toast.error(err.message);
    } finally { setBusy(false); e.target.value = ''; }
  }
  async function save() { const { brand_name, announcement, contact_email } = s; const { error } = await supabase.from('site_settings').update({ brand_name, announcement, contact_email, updated_at: new Date().toISOString() }).eq('id', 1); error ? toast.error(error.message) : toast.success('Settings saved'); }
  if (!s) return <p className="text-[var(--muted)]">Loading…</p>;
  return (
    <div className="max-w-xl space-y-4">
      <Field label="Logo (PNG/SVG, transparent background works best)">
        <div className="flex items-center gap-4"><div className="grid h-16 min-w-[8rem] place-items-center rounded-xl border border-[var(--line)] bg-white p-2">{s.logo_path ? <img src={mediaUrl(s.logo_path)} alt="" className="max-h-12" /> : <span className="tracking-[0.28em] font-semibold">WENZY</span>}</div><input type="file" accept="image/*" onChange={logo} disabled={busy} className="text-sm" /></div>
      </Field>
      <Field label="Brand name"><input className="input" value={s.brand_name} onChange={(e) => setS({ ...s, brand_name: e.target.value })} /></Field>
      <Field label="Announcement bar (leave empty to hide)"><input className="input" value={s.announcement || ''} onChange={(e) => setS({ ...s, announcement: e.target.value })} /></Field>
      <Field label="Contact email"><input className="input" value={s.contact_email || ''} onChange={(e) => setS({ ...s, contact_email: e.target.value })} /></Field>
      <Button onClick={save}>Save settings</Button>
    </div>
  );
}
