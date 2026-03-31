# FairwayGives — Golf Charity Subscription Platform

> Built for Digital Heroes Full-Stack Trainee Selection · PRD v1.0

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Auth | Supabase Auth |
| Database | Supabase Postgres (with RLS + triggers) |
| Payments | Stripe (subscriptions + one-off donations) |
| Email | Resend (optional) |
| Deploy | Vercel (new account required) |

---

## SETUP GUIDE — Step by Step

### STEP 1 — Clone & Install

```bash
# Copy all files into a folder called fairway-gives
cd fairway-gives
npm install
```

---

### STEP 2 — Create New Supabase Project

1. Go to https://supabase.com → Sign up with a NEW account
2. Click **New Project** → name it `fairway-gives`
3. Choose a region close to your users (e.g. EU West)
4. Wait for project to provision (~2 min)

**Run the database schema:**
1. In Supabase dashboard → go to **SQL Editor**
2. Open `lib/supabase/schema.sql` from this project
3. Paste the entire contents → click **Run**
4. You should see: "Success. No rows returned"

**Create storage buckets:**
1. Go to **Storage** in Supabase dashboard
2. Click **New bucket** → name: `winner-proofs` → **Private**
3. Click **New bucket** → name: `charity-images` → **Public**

**Add storage policy for winner-proofs:**
Go to Storage → winner-proofs → Policies → Add policy:
```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users upload own proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'winner-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'winner-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins read all proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'winner-proofs' AND
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
```

**Get your Supabase keys:**
- Go to **Settings** → **API**
- Copy: `Project URL`, `anon public`, `service_role secret`

---

### STEP 3 — Create Stripe Account

1. Go to https://stripe.com → Sign up with a NEW account
2. Stay in **Test mode** (toggle top right)

**Create products:**
- Go to **Products** → **Add product**
- Product 1:
  - Name: `FairwayGives Monthly`
  - Price: £9.99 → Recurring → Monthly
  - Copy the **Price ID** (starts with `price_`)
- Product 2:
  - Name: `FairwayGives Yearly`
  - Price: £99.99 → Recurring → Yearly
  - Copy the **Price ID**

**Get API keys:**
- Go to **Developers** → **API keys**
- Copy: `Publishable key` (pk_test_...) and `Secret key` (sk_test_...)

**Set up webhook (for local dev):**
```bash
# Install Stripe CLI
# Mac: brew install stripe/stripe-cli/stripe
# Windows: download from https://github.com/stripe/stripe-cli/releases

stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the webhook signing secret (whsec_...)
```

**Set up webhook (for production/Vercel):**
- Go to Stripe → **Developers** → **Webhooks** → **Add endpoint**
- URL: `https://your-vercel-url.vercel.app/api/stripe/webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- Copy the **Signing secret** (whsec_...)

---

### STEP 4 — Configure Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in all values:

```env
# Supabase (from Step 2)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Stripe (from Step 3)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

# App URL (localhost for dev, your Vercel URL for prod)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### STEP 5 — Create Admin User

1. Run dev server: `npm run dev`
2. Go to `http://localhost:3000/signup`
3. Create your account (e.g. admin@fairwaygives.com)
4. Check email → click confirmation link
5. Go to Supabase dashboard → **Table Editor** → `profiles`
6. Find your row → click edit → change `role` from `subscriber` to `admin`
7. Save → now visit `http://localhost:3000/admin`

---

### STEP 6 — Run Locally

```bash
npm run dev
# App runs at http://localhost:3000
```

**Test accounts to create:**
| Role | Email | Password |
|---|---|---|
| Admin | admin@fairwaygives.com | Admin123! |
| Subscriber | test@fairwaygives.com | Test1234! |

**Test subscription (Stripe test card):**
- Card: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits

---

### STEP 7 — Deploy to Vercel

1. Go to https://vercel.com → Sign up with a **NEW account**
2. Push your code to a GitHub repo:
```bash
git init
git add .
git commit -m "Initial commit"
# Create new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/fairway-gives.git
git push -u origin main
```
3. In Vercel → **New Project** → Import your GitHub repo
4. Framework: **Next.js** (auto-detected)
5. Add all environment variables from your `.env.local`
   - Change `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://fairway-gives.vercel.app`)
6. Click **Deploy**

**After deploy:**
- Update your Stripe webhook URL to the live Vercel URL
- Update `NEXT_PUBLIC_APP_URL` in Vercel environment variables
- Re-deploy once to pick up the new env var

---

## Project Structure

```
fairway-gives/
├── app/
│   ├── page.tsx                    Homepage / landing
│   ├── (auth)/login                Login page
│   ├── (auth)/signup               Signup page
│   ├── subscribe/                  Plan selection + Stripe checkout
│   ├── dashboard/                  User dashboard (overview, scores, charity, draws)
│   ├── admin/                      Admin panel (users, draws, charities, winners)
│   ├── (public)/charities/         Public charity listing
│   └── api/                        API routes
│       ├── stripe/webhook          Stripe event handler
│       ├── subscription/checkout   Create Stripe session
│       ├── draws/simulate          Admin: simulate draw
│       ├── draws/run               Admin: run + publish draw
│       ├── scores/                 Score CRUD
│       └── charity/donate          One-off donation
│
├── lib/
│   ├── supabase/schema.sql         Full DB schema — run this first
│   ├── supabase/client.ts          Browser Supabase client
│   ├── supabase/server.ts          Server + admin Supabase clients
│   ├── supabase/types.ts           TypeScript types
│   ├── stripe/config.ts            Stripe instance + plan config
│   └── draw-engine/index.ts        Draw logic (random + weighted)
│
└── components/
    ├── ui/Button.tsx
    ├── ui/Input.tsx
    ├── ui/Card.tsx
    ├── layout/Navbar.tsx
    └── layout/Footer.tsx
```

---

## Submission Checklist

Before submitting, verify each item:

- [ ] User signup → email confirmed → redirected to subscribe
- [ ] Monthly subscription checkout → Stripe test card → success page
- [ ] Yearly subscription checkout → Stripe test card → success page
- [ ] Score entry: add 5 scores, add 6th → oldest auto-removed
- [ ] Score range validation: 1–45 enforced
- [ ] Dashboard shows subscription status, scores, charity, draw history
- [ ] Charity selection → percentage slider (min 10%) → saved
- [ ] Independent donation → Stripe checkout
- [ ] Admin: users list → expand → edit score → change subscription status
- [ ] Admin: draw simulate → review numbers + winners → publish
- [ ] Admin: charities → add / edit / delete / feature
- [ ] Admin: winners → approve / reject → mark paid
- [ ] Winner proof upload (from dashboard/draws)
- [ ] Responsive on mobile
- [ ] 404 page works
- [ ] No console errors on main flows

---

## Test Data Setup (after deploy)

1. Create admin user → set role in Supabase
2. Create 2–3 subscriber accounts via `/signup`
3. Subscribe each (Stripe test card `4242...`)
4. Add 5 scores to each subscriber account
5. In admin panel → Draw Engine → Simulate → Publish
6. Check Dashboard → Draws shows results
7. If any user matched → test proof upload + admin verify flow

---

## Notes for Evaluators

- **Score rolling** is enforced at DB level via Postgres trigger (not app code) — bulletproof even if called via API directly
- **Subscription gating** runs in Next.js middleware on every request — no client-side bypass possible
- **Draw engine** supports 3 modes: random, weighted-frequent, weighted-rare — configurable per draw
- **Jackpot rollover** persisted in `draws.jackpot_carry_forward` — admin manually carries it forward each month
- **RLS policies** ensure users can only read/write their own data; service role key used only in server-side API routes
- All Zod validation on both client forms and API routes
