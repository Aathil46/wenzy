# WENZY storefront

Next.js 14 · Tailwind · Supabase (auth, Postgres, Storage) · Razorpay

## Run
1. `cp .env.example .env.local` and fill the three empty values (service-role key, Razorpay key id + secret).
2. `npm install && npm run dev` → http://localhost:3000
3. Deploy to Vercel (add the same env vars there).

## Admin account (one-time)
Supabase dashboard → Authentication → Users → **Add user** → `wenzy.originals@gmail.com`, set a password, tick *Auto confirm*.
Then sign in at `/admin`. Only this email is treated as admin by the database (RLS `is_admin()`), so nobody else can write.
Also: Authentication → Sign In / Providers → keep **Confirm email** ON and **disable public sign-ups** (you only need this one user); turn on leaked-password protection.
Add `https://YOUR-DOMAIN/admin` to Authentication → URL Configuration → Redirect URLs (for password reset).

## Notes
- Media lives in the public Storage bucket `wenzy-media` (logo, banners, collections, product images/videos).
- Prices and stock are always re-checked on the server in `/api/checkout`; payment signature verified in `/api/verify`; stock is decremented atomically by `finalize_paid_order()`.
- Free-shipping threshold / fee: `lib/config.js`.
