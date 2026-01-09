# better-auth-affiliates

A complete affiliate and referral system plugin for [Better Auth](https://better-auth.com). Track clicks, manage commissions, and grow with partner marketing.

## Features

- **Affiliate Links** - Generate unique tracking codes with custom commission structures
- **Click Tracking** - Monitor clicks, conversions, and revenue in real-time
- **Stripe Integration** - Automatic conversion tracking and recurring commissions via Stripe webhooks
- **Recurring Commissions** - Track commissions on subscription renewals for a configurable duration
- **Tiered Commissions** - Reward top performers with increasing commission rates based on referral count
- **Partner Dashboard** - Pre-built React components for affiliates to track performance
- **Better Auth Native** - Zero-config integration with your existing auth setup
- **Type-Safe** - Full TypeScript support with Zod validation throughout
- **Database Agnostic** - Works with any database adapter Better Auth supports

## Installation

```bash
npm install better-auth-affiliates
```

## Quick Start

### 1. Add the plugin to your Better Auth configuration

```typescript
// auth.ts
import { betterAuth } from "better-auth"
import { affiliatePlugin } from "better-auth-affiliates"

export const auth = betterAuth({
  plugins: [
    affiliatePlugin({
      commissionRate: "30.00",        // 30% commission
      commissionType: "percentage",    // or "fixed" for flat rate
      commissionDurationMonths: 12,    // Earn commission for 12 months
      cookieDurationDays: 30,          // 30-day attribution window
    }),
  ],
})
```

### 2. Run database migrations

```bash
bun run db:push
```

### 3. Add the client plugin

```typescript
// auth-client.ts
import { createAuthClient } from "better-auth/client"
import { affiliateClientPlugin } from "better-auth-affiliates/client"

export const authClient = createAuthClient({
  plugins: [affiliateClientPlugin()],
})
```

### 4. Track affiliate clicks on your landing page

```typescript
// When a user visits with ?ref=CODE
const code = new URLSearchParams(window.location.search).get("ref")
if (code) {
  await authClient.affiliate.trackClick({ code })
  // Cookie is set automatically for attribution
}
```

## Stripe Integration

The plugin integrates seamlessly with the [Better Auth Stripe plugin](https://www.better-auth.com/docs/plugins/stripe) for automatic conversion tracking.

### Setup with Stripe

```typescript
// auth.ts
import { betterAuth } from "better-auth"
import { stripe } from "@better-auth/stripe"
import { affiliatePlugin, stripeIntegration } from "better-auth-affiliates"

export const auth = betterAuth({
  plugins: [
    stripe({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,

      // Pass affiliate code to Stripe checkout metadata
      getCheckoutSessionParams({ request }) {
        return stripeIntegration.getCheckoutSessionParams(request)
      },

      // Automatically record conversion on first subscription payment
      async onSubscriptionComplete({ subscription, user, stripeSubscription }) {
        await stripeIntegration.handleSubscriptionComplete({
          auth,
          user,
          stripeSubscription,
        })
      },

      // Track recurring commissions on invoice.paid events
      async onEvent({ event }) {
        await stripeIntegration.handleStripeEvent({ auth, event })
      },
    }),

    affiliatePlugin({
      commissionRate: "30.00",
      commissionType: "percentage",
      commissionDurationMonths: 12,

      // Optional callbacks for notifications
      async onReferralSignup({ affiliateLink, referredUser, affiliateCode }) {
        console.log(`New signup via affiliate ${affiliateCode}`)
      },
      async onReferralConversion({ referral, affiliateLink, commissionAmount }) {
        console.log(`Conversion! Commission: $${commissionAmount}`)
      },
      async onRecurringCommission({ referral, affiliateLink, commission }) {
        console.log(`Recurring commission: $${commission.amount}`)
      },
    }),
  ],
})
```

### How It Works

1. **Affiliate Code Attribution**: When a user clicks an affiliate link, the code is stored in a cookie
2. **Checkout Metadata**: The `stripeIntegration.getCheckoutSessionParams()` helper adds the affiliate code to Stripe checkout session metadata
3. **Initial Conversion**: When a subscription is created, `handleSubscriptionComplete()` records the conversion and calculates commission
4. **Recurring Commissions**: `handleStripeEvent()` listens for `invoice.paid` events and tracks recurring commissions
5. **Commission Expiration**: Recurring commissions stop after `commissionDurationMonths` (configurable)

## Tiered Commissions

Reward your top-performing affiliates with increasing commission rates as they bring in more paying customers.

### Configuration

```typescript
affiliatePlugin({
  commissionRate: "20.00",        // Default rate for new affiliates
  commissionType: "percentage",

  // Define commission tiers based on paid referral count
  commissionTiers: [
    { minPaidReferrals: 0, rate: "20.00", name: "Bronze" },
    { minPaidReferrals: 10, rate: "25.00", name: "Silver" },
    { minPaidReferrals: 25, rate: "30.00", name: "Gold" },
    { minPaidReferrals: 50, rate: "35.00", name: "Platinum" },
  ],

  // Optional: Get notified when affiliates level up
  async onTierUpgrade({ affiliateLink, previousTier, newTier }) {
    await sendEmail({
      to: affiliateLink.userId,
      subject: `Congratulations! You've reached ${newTier.name} tier!`,
      body: `Your commission rate is now ${newTier.rate}%`,
    })
  },
})
```

### How Tiers Work

- Affiliates start at the lowest tier (based on `minPaidReferrals: 0`)
- As they accumulate paid referrals, they automatically move to higher tiers
- Commission rates are applied based on the affiliate's current `paidReferralCount`
- The `onTierUpgrade` callback fires when an affiliate reaches a new tier
- Tier progress is included in the stats endpoint for display in dashboards

### Stats Response with Tiers

When tiers are configured, the stats endpoint includes tier information:

```typescript
const { stats } = await authClient.affiliate.getStats()

// stats includes:
// - currentTier: { minPaidReferrals: 10, rate: "25.00", name: "Silver" }
// - nextTier: { tier: { ... }, referralsNeeded: 15 }
// - tiersEnabled: true
```

### Helper Functions

The plugin exports helper functions for building custom UIs:

```typescript
import { getTierForAffiliate, getNextTier } from "better-auth-affiliates"

// Get current tier based on referral count
const currentTier = getTierForAffiliate(15, tiers)
// Returns: { minPaidReferrals: 10, rate: "25.00", name: "Silver" }

// Get next tier and referrals needed
const nextTier = getNextTier(15, tiers)
// Returns: { tier: { ... "Gold" ... }, referralsNeeded: 10 }
```

## Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `commissionRate` | `string` | Required | Commission rate (e.g., "30.00" for 30%) |
| `commissionType` | `"percentage" \| "fixed"` | Required | Whether rate is a percentage or fixed amount |
| `commissionDurationMonths` | `number` | `12` | How long to track recurring commissions |
| `cookieDurationDays` | `number` | `30` | Cookie duration for attribution |
| `commissionTiers` | `CommissionTier[]` | - | Array of tier definitions for tiered commissions |
| `onReferralSignup` | `function` | - | Callback when a referral signs up |
| `onReferralConversion` | `function` | - | Callback when a referral converts |
| `onRecurringCommission` | `function` | - | Callback when a recurring commission is recorded |
| `onTierUpgrade` | `function` | - | Callback when an affiliate reaches a new tier |

## API Endpoints

The plugin adds the following endpoints to your Better Auth server:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/affiliate/create-link` | POST | Required | Create a new affiliate link |
| `/affiliate/links` | GET | Required | Get user's affiliate links |
| `/affiliate/track-click` | POST | Public | Track a click on an affiliate link |
| `/affiliate/stats` | GET | Required | Get affiliate statistics |
| `/affiliate/commissions` | GET | Required | Get commission history |
| `/affiliate/deactivate-link` | POST | Required | Deactivate an affiliate link |
| `/affiliate/record-conversion` | POST | Public | Record a conversion (for webhooks) |
| `/affiliate/record-recurring` | POST | Public | Record a recurring commission |
| `/affiliate/mark-paid` | POST | Public | Mark commissions as paid |

## Client API

### Create an affiliate link

```typescript
const { link } = await authClient.affiliate.createLink({
  code: "SARAH2025",
  name: "Instagram Link",
  organizationId: "org-123", // optional
})
```

### Get affiliate links

```typescript
const { links } = await authClient.affiliate.getLinks({
  organizationId: "org-123", // optional
})
```

### Track a click

```typescript
await authClient.affiliate.trackClick({ code: "SARAH2025" })
```

### Get statistics

```typescript
const { stats } = await authClient.affiliate.getStats({
  organizationId: "org-123", // optional
  linkId: "link-456", // optional
})

// stats contains:
// - totalClicks
// - totalSignups
// - totalPaidReferrals
// - totalEarned
// - unpaidCommission
// - conversionRate
// - links (array with per-link stats)
// - recentReferrals
```

### Get commission history

```typescript
const { commissions } = await authClient.affiliate.getCommissions({
  status: "approved", // "pending" | "approved" | "paid" | "rejected"
  limit: 50,
  offset: 0,
})
```

### Mark commissions as paid

```typescript
await authClient.affiliate.markCommissionsPaid({
  commissionIds: ["comm-1", "comm-2"],
})
```

## Packages

This monorepo contains the following packages:

| Package | Description |
|---------|-------------|
| `better-auth-affiliates` | Core plugin for Better Auth |
| `@workspace/ui` | Base UI components built with shadcn/ui |
| `@workspace/elements` | Affiliate-specific React components |
| `web` | Demo application and documentation site |

## Components

### AffiliateDashboard

The main dashboard component that combines all affiliate components into a complete interface.

```tsx
<AffiliateDashboard
  affiliateLink={affiliateLink}
  referrals={referrals}
  baseUrl="https://yourapp.com"
  pendingEarnings={52.50}
  availableForPayout={112.50}
  currency="USD"
/>
```

### AffiliateStatsCard

Display key metrics with optional trend indicators.

```tsx
<AffiliateStatsCard
  title="Total Clicks"
  value={1247}
  icon="clicks"
  trend={{ value: 12.5, isPositive: true }}
/>
```

**Props:**
- `title` - Card title
- `value` - Metric value
- `icon` - One of: `clicks`, `signups`, `earnings`, `conversion`
- `format` - One of: `number`, `currency`, `percentage`
- `variant` - One of: `default`, `success`, `warning`, `primary`
- `trend` - Optional trend indicator with `value` and `isPositive`

### AffiliateLinkCard

Display and copy affiliate links.

```tsx
<AffiliateLinkCard
  code="DEMO2024"
  name="Demo Partner Program"
  baseUrl="https://yourapp.com"
  isActive={true}
  expiresAt={null}
/>
```

### CommissionBadge

Display commission rates.

```tsx
<CommissionBadge type="percentage" rate="15.00" size="lg" />
<CommissionBadge type="fixed" rate="50.00" fixedAmount="50.00" />
```

### EarningsSummary

Display earnings breakdown.

```tsx
<EarningsSummary
  totalEarned="2847.50"
  pendingEarnings={52.50}
  availableForPayout={112.50}
/>
```

### ReferralList

Display a list of referrals with status badges.

```tsx
<ReferralList
  referrals={referrals}
  currency="USD"
  emptyMessage="No referrals yet"
/>
```

## Database Schema

The plugin automatically creates the required tables via Better Auth's schema system. If you need to manually define the schema (e.g., for Drizzle migrations), here's the complete schema:

### Drizzle ORM Schema

```typescript
// schema.ts
import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core"

// Your existing user and organization tables from Better Auth
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  // ... other Better Auth user fields
})

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // ... other Better Auth organization fields
})

// Affiliate tables
export const affiliateLink = pgTable("affiliate_link", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name"),
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").references(() => organization.id, { onDelete: "cascade" }),
  commissionRate: text("commission_rate").notNull(),
  commissionType: text("commission_type").notNull(), // "percentage" or "fixed"
  fixedAmount: text("fixed_amount"),
  clickCount: integer("click_count").default(0),
  signupCount: integer("signup_count").default(0),
  paidReferralCount: integer("paid_referral_count").default(0),
  totalEarned: text("total_earned").default("0"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const referral = pgTable("referral", {
  id: text("id").primaryKey(),
  affiliateLinkId: text("affiliate_link_id").notNull().references(() => affiliateLink.id, { onDelete: "cascade" }),
  referrerId: text("referrer_id").references(() => user.id, { onDelete: "set null" }),
  referrerOrganizationId: text("referrer_organization_id").references(() => organization.id, { onDelete: "set null" }),
  referredUserId: text("referred_user_id").notNull().unique().references(() => user.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id"),
  status: text("status").default("pending"), // "pending", "active", "churned", "expired"
  commissionEarned: text("commission_earned").default("0"),
  commissionPaid: boolean("commission_paid").default(false),
  signedUpAt: timestamp("signed_up_at").notNull(),
  convertedAt: timestamp("converted_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const affiliateCommission = pgTable("affiliate_commission", {
  id: text("id").primaryKey(),
  referralId: text("referral_id").notNull().references(() => referral.id, { onDelete: "cascade" }),
  affiliateLinkId: text("affiliate_link_id").notNull().references(() => affiliateLink.id, { onDelete: "cascade" }),
  amount: text("amount").notNull(),
  paymentAmount: text("payment_amount").notNull(),
  stripeInvoiceId: text("stripe_invoice_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  type: text("type").notNull(), // "initial" or "recurring"
  status: text("status").default("pending"), // "pending", "approved", "paid", "rejected"
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})
```

### Raw SQL Schema

```sql
-- Affiliate Links
CREATE TABLE affiliate_link (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT,
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  organization_id TEXT REFERENCES organization(id) ON DELETE CASCADE,
  commission_rate TEXT NOT NULL,
  commission_type TEXT NOT NULL,
  fixed_amount TEXT,
  click_count INTEGER DEFAULT 0,
  signup_count INTEGER DEFAULT 0,
  paid_referral_count INTEGER DEFAULT 0,
  total_earned TEXT DEFAULT '0',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Referrals
CREATE TABLE referral (
  id TEXT PRIMARY KEY,
  affiliate_link_id TEXT NOT NULL REFERENCES affiliate_link(id) ON DELETE CASCADE,
  referrer_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  referrer_organization_id TEXT REFERENCES organization(id) ON DELETE SET NULL,
  referred_user_id TEXT NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'pending',
  commission_earned TEXT DEFAULT '0',
  commission_paid BOOLEAN DEFAULT false,
  signed_up_at TIMESTAMP NOT NULL,
  converted_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Commission Records (for tracking individual payments)
CREATE TABLE affiliate_commission (
  id TEXT PRIMARY KEY,
  referral_id TEXT NOT NULL REFERENCES referral(id) ON DELETE CASCADE,
  affiliate_link_id TEXT NOT NULL REFERENCES affiliate_link(id) ON DELETE CASCADE,
  amount TEXT NOT NULL,
  payment_amount TEXT NOT NULL,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_affiliate_link_code ON affiliate_link(code);
CREATE INDEX idx_affiliate_link_user_id ON affiliate_link(user_id);
CREATE INDEX idx_affiliate_link_organization_id ON affiliate_link(organization_id);
CREATE INDEX idx_referral_affiliate_link_id ON referral(affiliate_link_id);
CREATE INDEX idx_referral_referred_user_id ON referral(referred_user_id);
CREATE INDEX idx_referral_stripe_customer_id ON referral(stripe_customer_id);
CREATE INDEX idx_affiliate_commission_referral_id ON affiliate_commission(referral_id);
CREATE INDEX idx_affiliate_commission_stripe_invoice_id ON affiliate_commission(stripe_invoice_id);
```

### Table Overview

| Table | Description |
|-------|-------------|
| `affiliate_link` | Stores affiliate links with commission settings and stats |
| `referral` | Tracks users who signed up via affiliate links |
| `affiliate_commission` | Individual commission records for initial and recurring payments |

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- PostgreSQL database

### Setup

```bash
# Clone the repository
git clone https://github.com/your-username/better-auth-affiliates.git
cd better-auth-affiliates

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Push database schema
bun run db:push

# Seed demo data (optional)
bun run db:seed

# Start development server
bun run dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build all packages |
| `bun run test` | Run tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run lint` | Lint and format code |
| `bun run db:push` | Push schema to database |
| `bun run db:seed` | Seed demo data |
| `bun run db:studio` | Open Drizzle Studio |

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) with App Router
- **Auth**: [Better Auth](https://better-auth.com)
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Components**: [shadcn/ui](https://ui.shadcn.com)
- **Monorepo**: [Turborepo](https://turbo.build)
- **Package Manager**: [Bun](https://bun.sh)

## License

MIT
