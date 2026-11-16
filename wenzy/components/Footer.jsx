import Link from 'next/link';
export default function Footer({ brand, email }) {
  return (
    <footer className="mt-32 border-t border-[var(--line)]">
      <div className="mx-auto max-w-7xl px-5 py-14 grid gap-10 sm:grid-cols-3 text-sm">
        <div><p className="text-lg font-semibold tracking-[0.28em]">{brand}</p><p className="mt-3 text-[var(--muted)] max-w-xs">Considered clothing, made to be worn for years.</p></div>
        <div className="space-y-2"><p className="eyebrow">Explore</p><Link className="block" href="/shop">Shop all</Link><Link className="block" href="/#collections">Collections</Link></div>
        <div className="space-y-2"><p className="eyebrow">Contact</p><a className="block" href={`mailto:${email}`}>{email}</a><Link className="block text-[var(--muted)]" href="/admin">Staff</Link></div>
      </div>
      <p className="pb-8 text-center text-xs text-[var(--muted)]">© {new Date().getFullYear()} {brand}. All rights reserved.</p>
    </footer>
  );
}
