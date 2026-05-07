# Attar Luxe Perfume Store

A complete perfume ecommerce project built with Next.js 14 App Router, TypeScript, Tailwind CSS, Framer Motion, Prisma, PostgreSQL, NextAuth, and Nodemailer.

## Features

- Customer storefront with homepage, product shop, filters, sorting, pagination, product details, cart drawer, cart page, checkout, and thank-you page.
- Checkout supports home delivery or store pickup, creates database orders, reduces stock, and attempts customer/admin email notifications.
- Admin CMS with hidden entry, protected login, dashboard cards, order management, status filtering, category management, page management, and full product CRUD with image/video uploads.
- Database-managed storefront menu with CMS page links, custom links, show/hide controls, and ordering from the admin dashboard.
- Product variants for options such as 50 ml and 100 ml, with separate price and stock per option.
- Tunisian dinar pricing and a configurable home delivery fee, defaulting to `7 TND`.
- Prisma models for `User`, `Category`, `Product`, `ProductVariant`, `Page`, `Order`, and `OrderItem`.
- Zod validation, bcrypt password hashing, HTTP-only NextAuth sessions, basic in-memory rate limiting, CSP headers, and upload type/size checks.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and update the values:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Create a PostgreSQL database and set `DATABASE_URL`.

Example:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/attar_luxe?schema=public"
```

4. Generate Prisma Client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

5. Seed the first admin user, categories, and sample perfumes:

```bash
npm run seed
```

Default seed credentials come from `.env`:

```env
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="ChangeMe123!"
```

6. Start the dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Email Setup

Set these values in `.env` using Resend, SendGrid, Gmail app password, or another SMTP provider:

```env
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="smtp-user"
SMTP_PASSWORD="smtp-password"
SMTP_FROM="Attar Luxe <orders@example.com>"
ADMIN_NOTIFY_EMAIL="owner@example.com"
```

If SMTP values are missing or an email fails, order creation still succeeds and the error is logged.

## Admin Usage

- The admin link is intentionally not shown anywhere on the public storefront.
- Visit `/admin/login?access=YOUR_ADMIN_ACCESS_KEY` once to unlock the private login page for the current browser.
- Sign in with the seeded admin email/password.
- Manage products from `/admin/products`.
- Manage categories from `/admin/categories`.
- Manage custom storefront pages from `/admin/pages`.
- Manage storefront navigation from `/admin/menu`.
- View and update orders from `/admin/orders`.
- Uploaded product images and videos are stored in `public/uploads`.

This private URL is a concealment layer, not a replacement for authentication. Keep `ADMIN_ACCESS_KEY`, `NEXTAUTH_SECRET`, and your admin password strong and private.

When creating or editing a page, keep `Show this page in the main menu` enabled if you want it to appear in the public menu. You can reorder, rename, hide, or remove menu links from `/admin/menu`.

## Deployment

### Vercel

1. Push the project to GitHub.
2. Import it into Vercel.
3. Add all `.env` values in Vercel Project Settings.
4. Use a hosted PostgreSQL provider such as Railway, Supabase, or Neon.
5. Run migrations against production:

```bash
npx prisma migrate deploy
```

6. Run the seed once for the first admin user:

```bash
npm run seed
```

`public/uploads` is suitable for local development and simple persistent Node hosting. On Vercel, serverless filesystem writes are ephemeral, so switch the upload route to Cloudinary, S3, or another object store before relying on admin uploads in production.

### PostgreSQL Providers

- Railway: create a PostgreSQL service and copy the connection URL.
- Supabase: create a project, use the pooled or direct PostgreSQL URL.
- Neon: create a branch/database and copy the connection string.

## Scripts

- `npm run dev` starts the local dev server.
- `npm run build` generates Prisma Client and builds Next.js.
- `npm run start` starts the production server after build.
- `npm run lint` runs Next.js linting.
- `npm run prisma:migrate -- --name init` creates/applies a migration.
- `npm run seed` seeds admin and sample products.
- `npm run prisma:studio` opens Prisma Studio.

## Notes

- Keep `.env` private. Use `.env.example` only as a template.
- The admin password is hashed with bcrypt.
- File uploads accept jpeg, png, and webp images up to 4MB each, plus mp4 and webm videos up to 30MB each.
- The simple in-memory rate limiter is suitable for a small deployment; for higher traffic, replace it with Upstash Redis or another shared store.
