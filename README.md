# better-auth-affiliates

A complete affiliate and referral system plugin for [Better Auth](https://better-auth.com). Track clicks, manage commissions, and grow with partner marketing.

## Features

- **Affiliate Links** - Generate unique tracking codes with custom commission structures
- **Click Tracking** - Monitor clicks, conversions, and revenue in real-time
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
import { affiliates } from "better-auth-affiliates"

export const auth = betterAuth({
  plugins: [
    affiliates({
      defaultCommissionRate: 10,
      cookieExpiration: 30 * 24 * 60 * 60, // 30 days
    }),
  ],
})
```

### 2. Run database migrations

```bash
bun run db:push
```

### 3. Use the pre-built components

```tsx
import { AffiliateDashboard } from "@workspace/elements"

export default function MyAffiliatePage() {
  return (
    <AffiliateDashboard
      affiliateLink={affiliateData}
      referrals={referrals}
      baseUrl="https://yourapp.com"
      pendingEarnings={100}
      availableForPayout={500}
    />
  )
}
```

## Packages

This monorepo contains the following packages:

| Package | Description |
|---------|-------------|
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
