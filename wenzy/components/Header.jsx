'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';

const categories = [
  { label: 'Shop all', href: '/shop' },
  { label: 'Collections', href: '/#collections' },
  { label: 'T-shirts', href: '/category/t-shirts' },
];

function Icon({ name }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>,
    bag: <><path d="M5 8.5h14l-1 12H6l-1-12Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4">{paths[name]}</svg>;
}

export default function Header({ logoUrl, brand, announcement }) {
  const router = useRouter();
  const count = useCart((s) => s.items.reduce((a, i) => a + i.qty, 0));
  const setOpen = useCart((s) => s.setOpen);
  const [mounted, setMounted] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => setMounted(true), []);
  useEffect(() => setLogoFailed(false), [logoUrl]);
  useEffect(() => { document.body.style.overflow = menuOpen ? 'hidden' : ''; return () => { document.body.style.overflow = ''; }; }, [menuOpen]);
  function submitSearch(event) {
    event.preventDefault();
    if (!query.trim()) return;
    setSearchOpen(false); setMenuOpen(false); router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
  }
  return (
    <header className="sticky top-0 z-40">
      {announcement && <div className="bg-black px-4 py-2 text-center text-xs tracking-wide text-white">{announcement}</div>}
      <div className="glass border-b border-white/15">
        <div className="mx-auto grid h-[4.5rem] max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8">
          <nav className="hidden items-center gap-7 text-[.68rem] font-semibold uppercase tracking-[.2em] md:flex" aria-label="Product categories">
            {categories.map((category) => <Link key={category.label} href={category.href} className="header-link">{category.label}</Link>)}
          </nav>
          <button type="button" className="mr-auto flex items-center gap-2 md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Icon name="menu" /><span className="text-[.65rem] font-semibold uppercase tracking-[.2em]">Menu</span></button>
          <Link href="/" aria-label={brand} className="justify-self-center">
            {logoUrl && !logoFailed ? <img src={logoUrl} alt={brand} className="h-8 w-auto max-w-[8rem] object-contain" onError={() => setLogoFailed(true)} /> : <span className="text-lg font-semibold tracking-[0.28em]">{brand}</span>}
          </Link>
          <div className="flex items-center justify-self-end gap-3">
            <button type="button" className="header-icon" onClick={() => setSearchOpen((value) => !value)} aria-label="Search" aria-expanded={searchOpen}><Icon name="search" /></button>
            <Link href="/account" className="header-icon hidden sm:inline-flex" aria-label="Account"><Icon name="user" /></Link>
            <button type="button" className="header-icon relative" onClick={() => setOpen(true)} aria-label={`Open bag${mounted && count > 0 ? `, ${count} items` : ''}`}><Icon name="bag" />{mounted && count > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 text-[9px] font-bold text-black">{count}</span>}</button>
          </div>
        </div>
        {searchOpen && <form onSubmit={submitSearch} className="mx-auto flex max-w-[1440px] items-center gap-3 border-t border-white/10 px-5 py-3 sm:px-8"><Icon name="search" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search WENZY" aria-label="Search WENZY" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/45" /><button type="submit" className="text-[.65rem] font-semibold uppercase tracking-[.2em] text-white/75">Search</button></form>}
        {menuOpen && <div className="fixed inset-0 top-[4.5rem] z-50 bg-black px-6 py-8 md:hidden"><div className="flex items-center justify-between"><span className="text-[.65rem] font-semibold uppercase tracking-[.2em] text-white/70">WENZY / NAVIGATION</span><button type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><Icon name="close" /></button></div><nav className="mt-14 flex flex-col gap-6 text-3xl font-semibold uppercase tracking-[-.03em]">{categories.map((category) => <Link key={category.label} href={category.href} onClick={() => setMenuOpen(false)}>{category.label}</Link>)}<Link href="/account" onClick={() => setMenuOpen(false)} className="text-lg tracking-[.12em] text-white/60">Account</Link></nav></div>}
      </div>
    </header>
  );
}
