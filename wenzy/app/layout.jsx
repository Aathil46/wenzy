import './globals.css';
import { Toaster } from 'sonner';
import { supabase, mediaUrl } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'WENZY', description: 'WENZY — considered clothing.' };
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fafaf9' },
    { media: '(prefers-color-scheme: dark)', color: '#171717' },
  ],
};
export default async function RootLayout({ children }) {
  const { data: s } = await supabase.from('site_settings').select('*').eq('id', 1).single();
  const brand = s?.brand_name || 'WENZY';
  const logoUrl = s?.logo_path ? `${mediaUrl(s.logo_path)}?v=${encodeURIComponent(s.logo_path)}` : null;
  return (
    <html lang="en">
      <body>
        <Header logoUrl={logoUrl} brand={brand} announcement={s?.announcement} />
        <main>{children}</main>
        <Footer brand={brand} email={s?.contact_email || 'wenzy.originals@gmail.com'} />
        <CartDrawer />
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
