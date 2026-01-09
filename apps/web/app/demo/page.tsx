"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { signIn, signOut, useSession } from "@/lib/auth-client"
import { AffiliateDashboard } from "@workspace/elements/components/affiliate-dashboard"
import { Button } from "@workspace/ui/components/button"
import { ArrowLeft, Github, Link2, Loader2, LogOut, Plus, Sparkles } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

type AffiliateLink = {
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

type Referral = {
	id: string
	email: string
	status: "pending" | "converted" | "paid" | "rejected"
	amount?: string
	createdAt: Date
	paidAt?: Date
}

export default function DemoPage() {
	const { data: session, isPending } = useSession()
	const [affiliateData, setAffiliateData] = useState<{
		link: AffiliateLink
		referrals: Referral[]
	} | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	useEffect(() => {
		async function fetchData() {
			if (!session?.user) {
				setIsLoading(false)
				return
			}

			try {
				const response = await fetch("/api/affiliate/data")
				if (response.ok) {
					const data = await response.json()
					setAffiliateData(data)
				}
			} catch (error) {
				console.error("Failed to fetch affiliate data:", error)
			} finally {
				setIsLoading(false)
			}
		}

		if (!isPending) {
			fetchData()
		}
	}, [session, isPending])

	const pendingEarnings =
		affiliateData?.referrals
			.filter((r) => r.status === "converted")
			.reduce((sum, r) => sum + Number(r.amount || 0), 0) ?? 0

	const availableForPayout =
		affiliateData?.referrals
			.filter((r) => r.status === "paid")
			.reduce((sum, r) => sum + Number(r.amount || 0), 0) ?? 0

	const handleSignIn = () => {
		signIn.social({ provider: "google", callbackURL: "/demo" })
	}

	const handleSignOut = () => {
		signOut({ fetchOptions: { onSuccess: () => setAffiliateData(null) } })
	}

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
							<span className="font-medium">Live Dashboard</span>
						</div>
					</div>

					<div className="flex items-center gap-2">
						<ThemeToggle />
						{session?.user && (
							<>
								<span className="hidden text-sm text-muted-foreground sm:inline">
									{session.user.email}
								</span>
								<Button variant="ghost" size="sm" onClick={handleSignOut}>
									<LogOut className="size-4" />
								</Button>
							</>
						)}
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
							<div className="mb-2 flex items-center gap-2">
								<h1 className="text-3xl font-bold">Affiliate Dashboard</h1>
								<span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
									<span className="size-1.5 animate-pulse rounded-full bg-green-500" />
									Live
								</span>
							</div>
							<p className="text-muted-foreground">
								{session?.user
									? "Your real-time affiliate performance data."
									: "Sign in with Google to see your affiliate dashboard."}
							</p>
						</div>
						<Link href="/elements">
							<Button variant="outline" className="gap-2">
								<Sparkles className="size-4" />
								View Components
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Main Content */}
			<main className="mx-auto max-w-6xl px-6 py-12">
				{isPending || isLoading ? (
					<div className="flex flex-col items-center justify-center py-20">
						<Loader2 className="size-8 animate-spin text-muted-foreground" />
						<p className="mt-4 text-sm text-muted-foreground">Loading...</p>
					</div>
				) : !session?.user ? (
					<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-20">
						<div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
							<Link2 className="size-8 text-muted-foreground" />
						</div>
						<h2 className="mb-2 text-xl font-semibold">Sign in to continue</h2>
						<p className="mb-6 max-w-md text-center text-muted-foreground">
							Sign in with your Google account to view your affiliate dashboard and track your
							referral performance.
						</p>
						<Button onClick={handleSignIn} size="lg" className="gap-2">
							<svg className="size-5" viewBox="0 0 24 24">
								<path
									fill="currentColor"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="currentColor"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="currentColor"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="currentColor"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Sign in with Google
						</Button>
					</div>
				) : affiliateData ? (
					<div className="overflow-hidden rounded-lg border border-border bg-card p-6">
						<AffiliateDashboard
							affiliateLink={affiliateData.link}
							referrals={affiliateData.referrals}
							baseUrl={process.env.NEXT_PUBLIC_APP_URL || "https://yourapp.com"}
							pendingEarnings={pendingEarnings}
							availableForPayout={availableForPayout}
						/>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 py-20">
						<div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
							<Plus className="size-8 text-muted-foreground" />
						</div>
						<h2 className="mb-2 text-xl font-semibold">No affiliate links yet</h2>
						<p className="mb-6 max-w-md text-center text-muted-foreground">
							You don't have any affiliate links yet. Create your first link to start tracking
							referrals.
						</p>
						<div className="flex flex-col items-center gap-3 sm:flex-row">
							<code className="rounded-lg border border-border bg-background px-4 py-2 font-mono text-sm">
								bun run db:seed
							</code>
							<span className="text-sm text-muted-foreground">to add demo data</span>
						</div>
					</div>
				)}
			</main>

			{/* Footer */}
			<footer className="border-t border-border py-8">
				<div className="mx-auto max-w-6xl px-6">
					<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
						<p className="text-sm text-muted-foreground">
							Powered by{" "}
							<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
								better-auth-affiliates
							</code>
						</p>
						<div className="flex items-center gap-2">
							<Link href="/elements">
								<Button variant="outline" size="sm">
									Component Library
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
