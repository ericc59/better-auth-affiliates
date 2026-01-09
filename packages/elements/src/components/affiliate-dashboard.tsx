"use client"

import type { Referral } from "@workspace/elements/components/referral-list"
import { cn } from "@workspace/elements/lib/utils"
import { AffiliateLinkCard } from "./affiliate-link-card"
import { AffiliateStatsCard } from "./affiliate-stats-card"
import { CommissionBadge } from "./commission-badge"
import { EarningsSummary } from "./earnings-summary"
import { ReferralList } from "./referral-list"

export interface AffiliateLink {
	id: string
	code: string
	name: string | null
	commissionRate: string
	commissionType: "percentage" | "fixed"
	fixedAmount: string | null
	clickCount: number
	signupCount: number
	paidReferralCount: number
	totalEarned: string
	isActive: boolean
	expiresAt: Date | null
}

export interface AffiliateDashboardProps extends React.HTMLAttributes<HTMLDivElement> {
	affiliateLink: AffiliateLink
	referrals?: Referral[]
	baseUrl: string
	pendingEarnings?: string | number
	availableForPayout?: string | number
	currency?: string
}

export function AffiliateDashboard({
	className,
	affiliateLink,
	referrals = [],
	baseUrl,
	pendingEarnings = 0,
	availableForPayout = 0,
	currency = "USD",
	...props
}: AffiliateDashboardProps) {
	const conversionRate =
		affiliateLink.clickCount > 0
			? ((affiliateLink.signupCount / affiliateLink.clickCount) * 100).toFixed(1)
			: "0"

	return (
		<div className={cn("space-y-6 gap-6", className)} data-slot="affiliate-dashboard" {...props}>
			{/* Header with Link Info */}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold">Affiliate Dashboard</h1>
					<p className="text-muted-foreground">Track your referrals and earnings</p>
				</div>
				<CommissionBadge
					type={affiliateLink.commissionType}
					rate={affiliateLink.commissionRate}
					fixedAmount={affiliateLink.fixedAmount}
					currency={currency}
					size="lg"
				/>
			</div>

			{/* Affiliate Link Card */}
			<AffiliateLinkCard
				code={affiliateLink.code}
				name={affiliateLink.name}
				baseUrl={baseUrl}
				isActive={affiliateLink.isActive}
				expiresAt={affiliateLink.expiresAt}
			/>

			{/* Stats Grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<AffiliateStatsCard
					title="Total Clicks"
					value={affiliateLink.clickCount}
					icon="clicks"
					format="number"
				/>
				<AffiliateStatsCard
					title="Signups"
					value={affiliateLink.signupCount}
					icon="signups"
					format="number"
				/>
				<AffiliateStatsCard
					title="Conversion Rate"
					value={conversionRate}
					icon="conversion"
					format="percentage"
				/>
				<AffiliateStatsCard
					title="Paid Referrals"
					value={affiliateLink.paidReferralCount}
					icon="signups"
					format="number"
					variant="success"
				/>
			</div>

			{/* Earnings Summary */}
			<EarningsSummary
				totalEarned={affiliateLink.totalEarned}
				pendingEarnings={pendingEarnings}
				availableForPayout={availableForPayout}
				currency={currency}
			/>

			{/* Referral List */}
			<ReferralList referrals={referrals} currency={currency} />
		</div>
	)
}
