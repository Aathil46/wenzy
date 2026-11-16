# WENZY — Final Agent Implementation Plan

**Purpose:** Complete the existing WENZY storefront and Admin into a reliable, production-ready clothing e-commerce system. This is the implementation brief and acceptance contract for the coding agent.

## 1. Working rules

1. Work only on `claude-development`. Do not commit directly to `main`; do not merge or deploy without explicit approval.
2. Start by auditing the current code, database schema, migrations, storage usage, and Git status. Preserve working functionality; do not rebuild features that already work.
3. Treat the existing Next.js 14, Tailwind, Supabase Auth/Database/Storage, and Razorpay integration as the project baseline.
4. Make changes in small, coherent phases. After each phase, run lint/type checks where configured, production build, and focused browser tests. Report what was actually tested.
5. Never invent schema, assume a migration has been applied, or claim live integration is verified based only on a successful build.
6. Do not expose secrets, request service-role keys, weaken RLS, or put privileged credentials in browser code.
7. Do not recreate the Supabase project or the existing `wenzy-media` bucket. Preserve unrelated storage policies and existing data.
8. Avoid destructive migrations. Inspect the live schema and current migrations first; make backward-compatible, idempotent migrations where possible. Explain backup/rollback needs before risky changes.
9. Do not change unrelated files or introduce new homepage sections without approval.
10. Keep Admin workflows understandable to a non-technical store owner. Prefer sensible defaults over technical configuration.

## 2. Brand and design direction

- Brand: **WENZY**.
- Store: affordable, trend-led clothing for men and women.
- Current campaign/collection: **DOOMSDAY EDITION**.
- Visual direction: clean, modern, premium, restrained, predominantly neutral black-and-white.
- Use the existing Normless clone in the workspace as the reference for layout, spacing, typography, navigation, responsive behavior, and interactions. Adapt it to WENZY; do not copy its brand identity or content.
- Prioritize product imagery, readable typography, consistent spacing, accessible contrast, and polished mobile behavior.
- Do not introduce unrelated visual concepts or promotional copy.

## 3. Agreed homepage scope

Keep the homepage deliberately focused:

1. Existing-style header/navigation, adapted to WENZY and the reference layout.
2. Hero/banner area.
3. Exactly one T-shirts category section, dynamically populated from Admin-managed category data.
4. Footer.

Do not add other homepage rails, featured-product grids, testimonials, promotional sections, or editorial sections unless the owner approves them later. Existing shop, product, cart, checkout, and account routes remain available.

### Hero behavior

- No active banners: render no hero area.
- One active banner: show a static banner.
- More than one active banner: automatically run a carousel with sensible defaults.
- Admin controls content and order, not technical autoplay settings. Do not ask the owner to configure autoplay on/off or timing.
- Support desktop image and optional mobile image, optional title and button label, active/inactive status, ordering, and a destination.
- Destination choices must be selectable references: a product, category, collection, shop/internal page, or no link. Do not require manually typed URLs for internal destinations.
- Clicking a banner must navigate to its selected destination. Handle missing, unpublished, or deleted destinations safely; never leave broken links.
- Provide preview and clear validation before publishing.

## 4. Admin requirements

Admin must be the normal control center for store operations. All routine content changes must be possible through the UI without editing code or SQL.

### 4.1 Overview

- Useful summary of orders, sales where reliable data exists, products, and low-stock items.
- Recent orders with a direct path to order details.
- Do not show fabricated metrics or misleading zeroes when data is unavailable.

### 4.2 Products

- Create, view, edit, publish/unpublish, and archive/delete according to existing data relationships.
- Support product name, description, images, category assignment, collection assignment, price, sale price, SKU, variants (such as size), stock, status, and SEO fields where supported by the existing architecture.
- Validate prices, SKU uniqueness where required, variant data, and stock values.
- Product images must use the existing `wenzy-media` bucket and existing media URL conventions.
- Preserve current cart, product detail, pricing, and inventory behavior.

### 4.3 Categories

- Create, edit, reorder, publish/hide, feature, and delete categories.
- Support name, slug, description, image, display order, featured status, and SEO metadata where appropriate.
- Assign products to categories through Admin.
- Category changes must flow through storefront navigation, category pages, product/category relationships, homepage T-shirts section, and banner destination choices.
- Before deletion, detect products and banners referencing the category. Offer safe reassignment, removal of the affected references, or cancel. Never silently orphan products or create broken links.
- Prevent duplicate or invalid slugs and handle unpublished categories consistently.

### 4.4 Collections

- Keep collections distinct from categories. Categories are ongoing product classifications; collections are curated edits/campaigns such as DOOMSDAY EDITION or New Arrivals.
- Allow Admin to create, edit, publish/unpublish, order, and manage products in collections.
- Preserve existing collection data and routes.

### 4.5 Banners

- Add, edit, preview, reorder, activate/deactivate, and delete banners.
- Desktop image required; mobile image optional.
- Optional title and button text.
- Destination selector: product, category, collection, shop/internal page, or none.
- Display a clear preview and destination summary.
- Validate required content and destination references before activation.
- Do not expose autoplay toggles, intervals, or other implementation-level settings to the store owner.

### 4.6 Orders and customers

- Order list with status, payment state, date, customer, and total.
- Order detail with line items, customer/shipping information, payment reference, and status history where available.
- Clear operational status updates; prevent invalid transitions.
- Customer account data must remain private and protected by authorization.
- Preserve existing Supabase Auth flows, including sign-in, password reset, and sign-out.

### 4.7 Store settings and operations

- Keep existing settings and media management working.
- Provide clear states for loading, empty results, validation errors, and success/failure.
- Do not expose internal database or infrastructure configuration to ordinary Admin users.

## 5. Storefront requirements

- Responsive header, navigation, search, account entry, and mobile menu.
- Shop and category listings should reflect published products/categories only.
- Product detail pages should show accurate images, descriptions, pricing, sale pricing, variants, and availability.
- Cart must preserve selected variants and quantities and calculate totals consistently.
- Checkout must validate customer and delivery details and prevent invalid or unavailable items from being purchased.
- Customer account should support the existing authentication flow and show only that customer's permitted information.
- Ensure refresh, direct URL navigation, and browser back/forward behavior work correctly.
- Add useful loading, empty, error, and not-found states.

## 6. Payments, orders, and inventory

Audit the existing Razorpay implementation before changing it.

- Payment creation and verification must happen through trusted server-side code.
- Never trust a client-side success callback as proof of payment.
- Verify payment signatures/server responses and use idempotent webhook handling.
- Prevent duplicate orders or duplicate payment processing on retries.
- Keep order status and payment status distinct and consistent.
- Reserve or decrement stock safely; protect against overselling when concurrent checkouts occur.
- Restore stock on valid cancellation/refund flows according to the established business rules.
- Do not mark an order paid until trusted verification succeeds.
- Test success, failure, cancellation, retry, duplicate webhook, and out-of-stock cases.

## 7. Data and Supabase approach

First inspect the real schema and existing application queries. Reuse current tables and relationships where they are sound. Do not create duplicate tables merely because this plan lists a concept.

Potential logical areas to verify against the current schema:

- Products, product images, variants/SKUs, stock/inventory.
- Categories and product-category relationships.
- Collections and collection-product relationships.
- Banners and typed destination references.
- Profiles/customer details and addresses.
- Carts, orders, order items, payments, coupons/discounts, returns.
- Store settings and content.

### Security requirements

- Preserve the existing `public.is_admin()` authorization model and current RLS protections unless a specific defect is demonstrated and approved for correction.
- Existing `wenzy-media` bucket remains in place. Do not recreate it.
- Preserve policies for unrelated buckets such as `brand-assets`.
- Admin-only Storage listing/mutations must remain protected. Public storefront image delivery should use public object URLs, not anonymous bucket listing.
- Never use service-role credentials in client-side code.
- Validate authorization server-side for every privileged operation; hiding Admin UI is not authorization.
- Ensure customers can only read or modify their own permitted records.
- Do not log passwords, tokens, payment secrets, or sensitive customer data.

## 8. Performance, SEO, accessibility, and quality

- Optimize and size images appropriately; use responsive images and avoid unnecessary cache busting on product media.
- Keep the logo cache fix intact unless a regression is proven.
- Use semantic HTML, keyboard-accessible controls, visible focus states, useful alt text, and accessible labels.
- Add page titles, descriptions, canonical URLs, and appropriate product/category metadata where applicable.
- Avoid layout shifts, broken images, console errors, hydration errors, and unnecessary client-side fetching.
- Test mobile, tablet, and desktop layouts.
- Do not add dependencies unless needed; explain significant additions.

## 9. Phased delivery sequence

### Phase 0 — Audit and baseline (do this first; no feature implementation yet)

- Inspect Git branch/status and identify all local/uncommitted changes.
- Map routes, components, data access, authentication, Admin permissions, storage, payment flow, and current migrations.
- Compare the actual Supabase schema and RLS policies with application assumptions.
- Inspect the pending banner/SKU migration before applying it; verify whether it is already applied and whether it matches the live schema.
- Run the existing build and tests; record current failures separately from new issues.
- Deliver a concise gap report with each feature marked **working / partial / broken / missing**, evidence, risks, and recommended phase.
- Do not apply migrations or make feature changes during this audit.

### Phase 1 — Foundations and design consistency

- Resolve only confirmed foundation defects.
- Establish reusable typography, spacing, buttons, form controls, cards, dialogs, and responsive patterns.
- Align the header and hero with the reference while preserving the agreed homepage scope.

### Phase 2 — Category and product foundations

- Complete category management and safe deletion.
- Complete product/category assignment and product data validation.
- Confirm category/product pages and homepage category data are driven by the same source of truth.

### Phase 3 — Collections and banner destinations

- Complete collection management.
- Complete banner CRUD, preview, ordering, responsive assets, and typed destinations.
- Validate deleted/unpublished destination handling and the zero/one/multiple banner behavior.

### Phase 4 — Storefront shopping journey

- Verify shop, category, product details, search, variants, cart, and responsive navigation.
- Fix broken or inconsistent customer-facing states.

### Phase 5 — Checkout, payment, and inventory

- Audit and harden Razorpay verification, order creation, webhook idempotency, stock concurrency, and failure handling.
- Run end-to-end payment and inventory tests in the appropriate test environment.

### Phase 6 — Customer accounts and order experience

- Verify authentication, password reset, account privacy, order history, and customer-facing order states.

### Phase 7 — Admin operations

- Complete order management, inventory visibility, customer support essentials, and store settings based on the existing schema and agreed scope.

### Phase 8 — Release readiness

- Run security, regression, accessibility, responsive, SEO, and performance checks.
- Verify migrations and environment configuration.
- Produce deployment/rollback notes and a final acceptance report.
- Do not deploy or merge to `main` without explicit approval.

## 10. Acceptance checklist

The work is not complete until all applicable checks pass:

- [ ] Agent confirms correct branch and cleanly identifies pre-existing changes.
- [ ] Existing features are preserved; no unexplained regressions.
- [ ] Admin can create/edit/reorder/publish/hide categories.
- [ ] Category deletion detects dependent products and banner destinations and offers safe choices.
- [ ] Product assignment and category pages remain consistent.
- [ ] Collections remain distinct from categories and work end-to-end.
- [ ] Admin can create and publish banners with desktop/mobile assets and valid destinations.
- [ ] Banner destination opens the exact selected product/category/collection/page.
- [ ] Zero active banners hides the hero; one is static; multiple rotate automatically.
- [ ] Admin does not need to configure technical carousel settings.
- [ ] Product details, variants, prices, stock, cart, and checkout remain consistent.
- [ ] Payment is verified server-side; duplicate callbacks/webhooks do not duplicate orders.
- [ ] Concurrent purchases cannot oversell stock.
- [ ] Customers cannot access another customer's private data.
- [ ] Non-admin users cannot perform Admin or privileged Storage operations.
- [ ] Public product/banner images render without exposing bucket listings.
- [ ] Mobile, tablet, and desktop layouts are usable.
- [ ] No critical console, hydration, build, or runtime errors.
- [ ] Migrations are verified against the live schema and have safe rollback notes.
- [ ] Final report distinguishes verified behavior from untested assumptions.

## 11. Required agent reporting format

At the end of each phase, report:

1. **Completed:** exact user-visible and technical changes.
2. **Files changed:** concise list.
3. **Database:** migrations created/applied, tables/policies affected, and verification evidence.
4. **Tests:** exact commands and browser flows run, with pass/fail results.
5. **Known gaps/risks:** what remains incomplete or unverified.
6. **Git:** branch, commit SHA if committed, and whether changes are pushed.
7. **Next phase:** proposed next bounded task.

## Immediate instruction

Begin with **Phase 0 only**. Audit the existing implementation and deliver the gap report. Do not start Phase 1 or modify application features until the owner reviews the audit and approves the next phase.
