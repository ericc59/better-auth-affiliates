"use client"

import { CodeBlock } from "@/components/code-block"
import { ThemeToggle } from "@/components/theme-toggle"
import { AffiliateDashboard } from "@workspace/elements/components/affiliate-dashboard"
import { AffiliateLinkCard } from "@workspace/elements/components/affiliate-link-card"
import { AffiliateStatsCard } from "@workspace/elements/components/affiliate-stats-card"
import { CommissionBadge } from "@workspace/elements/components/commission-badge"
import { EarningsSummary } from "@workspace/elements/components/earnings-summary"
import { ReferralList } from "@workspace/elements/components/referral-list"
import { Button } from "@workspace/ui/components/button"
import { ArrowLeft, Check, Copy, Github, Info, Link2, Package } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

// Demo data for component showcase
const demoAffiliateLink = {
	id: "demo-1",
	code: "DEMO2024",
	name: "Demo Partner Program",
	commissionRate: "15.00",
	commissionType: "percentage" as const,
	fixedAmount: null,
	clickCount: 1247,
	signupCount: 89,
	paidReferralCount: 67,
	totalEarned: "2847.50",
	isActive: true,
	expiresAt: null,
}

const demoReferrals = [
	{
		id: "ref-1",
		email: "john.doe@example.com",
		status: "paid" as const,
		amount: "45.00",
		createdAt: new Date("2024-12-01"),
		paidAt: new Date("2024-12-15"),
	},
	{
		id: "ref-2",
		email: "jane.smith@example.com",
		status: "paid" as const,
		amount: "67.50",
		createdAt: new Date("2024-12-05"),
		paidAt: new Date("2024-12-18"),
	},
	{
		id: "ref-3",
		email: "alex.wilson@example.com",
		status: "converted" as const,
		amount: "52.50",
		createdAt: new Date("2024-12-20"),
	},
	{
		id: "ref-4",
		email: "sarah.johnson@example.com",
		status: "pending" as const,
		createdAt: new Date("2024-12-28"),
	},
	{
		id: "ref-5",
		email: "mike.brown@example.com",
		status: "pending" as const,
		createdAt: new Date("2024-12-30"),
	},
]

const usageCode = `import { AffiliateDashboard } from "@workspace/elements"

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
}`

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false)

	const handleCopy = async () => {
		await navigator.clipboard.writeText(text)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<button
			type="button"
			onClick={handleCopy}
			className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
		>
			{copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
		</button>
	)
}

export default function ElementsPage() {
	const pendingEarnings = demoReferrals
		.filter((r) => r.status === "converted")
		.reduce((sum, r) => sum + Number(r.amount || 0), 0)

	const availableForPayout = demoReferrals
		.filter((r) => r.status === "paid")
		.reduce((sum, r) => sum + Number(r.amount || 0), 0)

	return (
		<div className="min-h-svh bg-background text-foreground">
			{/* Header */}
			<header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
				<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
					<div className="flex items-center gap-4">
						<Link href="/">
							<Button variant="ghost" size="sm" className="gap-2">
								<ArrowLeft className="size-4" />
								Back
							</Button>
						</Link>
						<div className="h-5 w-px bg-border" />
						<div className="flex items-center gap-2">
							<div className="flex size-6 items-center justify-center rounded bg-foreground">
								<Link2 className="size-3 text-background" />
							</div>
							<span className="font-medium">Component Library</span>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<ThemeToggle />
						<Link
							href="https://github.com"
							className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<Github className="size-4" />
							<span className="hidden sm:inline">View Source</span>
						</Link>
					</div>
				</div>
			</header>

			{/* Page Header */}
			<section className="border-b border-border py-12">
				<div className="mx-auto max-w-6xl px-6">
					<div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
						<div>
							<h1 className="mb-2 text-3xl font-bold">Component Showcase</h1>
							<p className="text-muted-foreground">
								Pre-built React components for affiliate dashboards. Copy, paste, customize.
							</p>
						</div>
						<div className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
							<Package className="size-4 text-muted-foreground" />
							<code className="font-mono text-sm">@workspace/elements</code>
							<CopyButton text="npm install @workspace/elements" />
						</div>
					</div>
				</div>
			</section>

			{/* Main Content */}
			<main className="mx-auto max-w-6xl px-6 py-12">
				{/* Demo Notice */}
				<div className="mb-12 flex items-start gap-4 rounded-lg border border-border bg-card p-4">
					<Info className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
					<div>
						<p className="mb-1 font-medium">Static demo data</p>
						<p className="text-sm text-muted-foreground">
							These components are shown with mock data. Visit the{" "}
							<Link href="/demo" className="text-foreground underline underline-offset-2 hover:no-underline">
								live demo
							</Link>{" "}
							to see real data in action.
						</p>
					</div>
				</div>

				{/* Full Dashboard */}
				<section className="mb-16">
					<div className="mb-6 flex items-center justify-between">
						<div>
							<h2 className="text-xl font-semibold">Full Dashboard</h2>
							<p className="text-sm text-muted-foreground">Complete AffiliateDashboard component</p>
						</div>
						<span className="rounded border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
							{"<AffiliateDashboard />"}
						</span>
					</div>

					<div className="overflow-hidden rounded-lg border border-border bg-card p-6">
						<AffiliateDashboard
							affiliateLink={demoAffiliateLink}
							referrals={demoReferrals}
							baseUrl="https://yourapp.com"
							pendingEarnings={pendingEarnings}
							availableForPayout={availableForPayout}
						/>
					</div>
				</section>

				{/* Individual Components */}
				<section className="mb-16">
					<h2 className="mb-8 text-xl font-semibold">Individual Components</h2>

					{/* Stats Cards */}
					<div className="mb-10">
						<div className="mb-4 flex items-center justify-between">
							<span className="rounded border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
								{"<AffiliateStatsCard />"}
							</span>
							<span className="text-xs text-muted-foreground">4 variants</span>
						</div>
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<AffiliateStatsCard
								title="Total Clicks"
								value={demoAffiliateLink.clickCount}
								icon="clicks"
								trend={{ value: 12.5, isPositive: true }}
							/>
							<AffiliateStatsCard
								title="Signups"
								value={demoAffiliateLink.signupCount}
								icon="signups"
								trend={{ value: 8.2, isPositive: true }}
							/>
							<AffiliateStatsCard
								title="Total Earned"
								value={demoAffiliateLink.totalEarned}
								icon="earnings"
								format="currency"
								variant="success"
							/>
							<AffiliateStatsCard
								title="Conversion Rate"
								value={(
									(demoAffiliateLink.signupCount / demoAffiliateLink.clickCount) *
									100
								).toFixed(1)}
								icon="conversion"
								format="percentage"
							/>
						</div>
					</div>

					{/* Commission Badges */}
					<div className="mb-10">
						<div className="mb-4 flex items-center justify-between">
							<span className="rounded border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
								{"<CommissionBadge />"}
							</span>
							<span className="text-xs text-muted-foreground">2 types, 3 sizes</span>
						</div>
						<div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-6">
							<CommissionBadge type="percentage" rate="15.00" size="sm" />
							<CommissionBadge type="percentage" rate="20.00" />
							<CommissionBadge type="percentage" rate="25.00" size="lg" />
							<div className="h-8 w-px bg-border" />
							<CommissionBadge type="fixed" rate="50.00" fixedAmount="50.00" />
							<CommissionBadge type="fixed" rate="100.00" fixedAmount="100.00" size="lg" />
						</div>
					</div>

					{/* Affiliate Link Cards */}
					<div className="mb-10">
						<div className="mb-4 flex items-center justify-between">
							<span className="rounded border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
								{"<AffiliateLinkCard />"}
							</span>
							<span className="text-xs text-muted-foreground">active & expired states</span>
						</div>
						<div className="grid gap-4 lg:grid-cols-2">
							<AffiliateLinkCard
								code={demoAffiliateLink.code}
								name={demoAffiliateLink.name}
								baseUrl="https://yourapp.com"
								isActive={demoAffiliateLink.isActive}
							/>
							<AffiliateLinkCard
								code="EXPIRED01"
								name="Expired Campaign"
								baseUrl="https://yourapp.com"
								isActive={false}
								expiresAt={new Date("2024-01-01")}
							/>
						</div>
					</div>

					{/* Earnings Summary */}
					<div className="mb-10">
						<div className="mb-4 flex items-center justify-between">
							<span className="rounded border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
								{"<EarningsSummary />"}
							</span>
							<span className="text-xs text-muted-foreground">3 metrics</span>
						</div>
						<EarningsSummary
							totalEarned={demoAffiliateLink.totalEarned}
							pendingEarnings={pendingEarnings}
							availableForPayout={availableForPayout}
						/>
					</div>

					{/* Referral List */}
					<div className="mb-10">
						<div className="mb-4 flex items-center justify-between">
							<span className="rounded border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
								{"<ReferralList />"}
							</span>
							<span className="text-xs text-muted-foreground">with status badges</span>
						</div>
						<ReferralList referrals={demoReferrals} />
					</div>

					{/* Empty State */}
					<div>
						<div className="mb-4 flex items-center justify-between">
							<span className="rounded border border-border bg-card px-2 py-1 font-mono text-xs text-muted-foreground">
								{"<ReferralList /> empty"}
							</span>
							<span className="text-xs text-muted-foreground">empty state</span>
						</div>
						<ReferralList
							referrals={[]}
							emptyMessage="No referrals yet. Share your link to get started!"
						/>
					</div>
				</section>

				{/* Usage Code */}
				<section>
					<div className="mb-6">
						<h2 className="text-xl font-semibold">Quick Start</h2>
						<p className="text-sm text-muted-foreground">Import and use in your Next.js app</p>
					</div>

					<CodeBlock code={usageCode} language="tsx" filename="page.tsx" />
				</section>
			</main>

			{/* Footer */}
			<footer className="border-t border-border py-8">
				<div className="mx-auto max-w-6xl px-6">
					<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
						<p className="text-sm text-muted-foreground">
							Components from{" "}
							<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
								@workspace/elements
							</code>
						</p>
						<div className="flex items-center gap-2">
							<Link href="/demo">
								<Button variant="outline" size="sm">
									View Live Demo
								</Button>
							</Link>
							<Link href="/">
								<Button variant="ghost" size="sm">
									<ArrowLeft className="size-4" />
									Back to Home
								</Button>
							</Link>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}
