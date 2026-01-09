"use client"

import { CodeBlock } from "@/components/code-block"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@workspace/ui/components/button"
import {
	ArrowRight,
	Check,
	ChevronRight,
	Copy,
	ExternalLink,
	Github,
	Link2,
	MousePointerClick,
	Package,
	Shield,
	Star,
	Terminal,
	Users,
	Zap,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

const features = [
	{
		icon: Link2,
		title: "Affiliate Links",
		description: "Generate unique tracking codes with custom commission structures.",
	},
	{
		icon: MousePointerClick,
		title: "Click Tracking",
		description: "Monitor clicks, conversions, and revenue in real-time.",
	},
	{
		icon: Users,
		title: "Partner Dashboard",
		description: "Pre-built components for affiliates to track performance.",
	},
	{
		icon: Shield,
		title: "Better Auth Native",
		description: "Zero-config integration with your existing auth setup.",
	},
	{
		icon: Zap,
		title: "Type-Safe",
		description: "Full TypeScript support with Zod validation throughout.",
	},
	{
		icon: Package,
		title: "Database Agnostic",
		description: "Works with any database adapter Better Auth supports.",
	},
]

const installCommand = "npm install better-auth-affiliates"

const codeExample = `import { betterAuth } from "better-auth"
import { affiliates } from "better-auth-affiliates"

export const auth = betterAuth({
  plugins: [
    affiliates({
      defaultCommissionRate: 10,
      cookieExpiration: 30 * 24 * 60 * 60, // 30 days
    }),
  ],
})`

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
			{copied ? (
				<>
					<Check className="size-4 text-green-500" />
					<span className="text-green-500">Copied</span>
				</>
			) : (
				<>
					<Copy className="size-4" />
					<span>Copy</span>
				</>
			)}
		</button>
	)
}

export default function LandingPage() {
	return (
		<div className="min-h-svh bg-background text-foreground">
			{/* Navigation */}
			<header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
				<div className="mx-auto max-w-6xl px-6">
					<div className="flex h-16 items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="flex size-8 items-center justify-center rounded-lg bg-foreground">
								<Link2 className="size-4 text-background" />
							</div>
							<span className="font-semibold">better-auth-affiliates</span>
						</div>
						<nav className="flex items-center gap-2">
							<ThemeToggle />
							<Link
								href="https://github.com"
								className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<Github className="size-4" />
								<span className="hidden sm:inline">GitHub</span>
							</Link>
							<Link href="/demo">
								<Button size="sm">
									View Demo
									<ArrowRight className="size-4" />
								</Button>
							</Link>
						</nav>
					</div>
				</div>
			</header>

			{/* Hero */}
			<section className="relative overflow-hidden border-b border-border py-24 md:py-32">
				{/* Subtle grid background */}
				<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />

				<div className="relative mx-auto max-w-6xl px-6">
					{/* Badges */}
					<div className="mb-8 flex flex-wrap items-center gap-3">
						<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm">
							<Star className="size-3.5 text-yellow-500" />
							<span className="text-muted-foreground">Open Source</span>
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm">
							<Package className="size-3.5 text-muted-foreground" />
							<span className="text-muted-foreground">v1.0.0</span>
						</span>
						<span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
							MIT License
						</span>
					</div>

					{/* Headline */}
					<h1 className="mb-6 max-w-3xl text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
						Affiliate programs for{" "}
						<span className="bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
							Better Auth
						</span>
					</h1>

					{/* Subheadline */}
					<p className="mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
						A complete referral and affiliate system plugin. Track clicks, manage commissions, and
						grow with partner marketing.
					</p>

					{/* Install command */}
					<div className="mb-8 inline-flex items-center gap-4 rounded-lg border border-border bg-card p-2">
						<div className="flex items-center gap-3 pl-2">
							<Terminal className="size-4 text-muted-foreground" />
							<code className="font-mono text-sm">{installCommand}</code>
						</div>
						<CopyButton text={installCommand} />
					</div>

					{/* CTA Buttons */}
					<div className="flex flex-wrap items-center gap-4">
						<Link href="/demo">
							<Button size="lg">
								View Demo
								<ArrowRight className="size-4" />
							</Button>
						</Link>
						<Button variant="outline" size="lg">
							Documentation
							<ExternalLink className="size-4 opacity-50" />
						</Button>
					</div>
				</div>
			</section>

			{/* Features */}
			<section className="border-b border-border py-24">
				<div className="mx-auto max-w-6xl px-6">
					<div className="mb-16">
						<h2 className="mb-4 text-2xl font-bold md:text-3xl">Features</h2>
						<p className="text-muted-foreground">
							Everything you need to run a successful affiliate program.
						</p>
					</div>

					<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
						{features.map((feature) => (
							<div
								key={feature.title}
								className="group rounded-lg border border-border bg-card/50 p-6 transition-colors hover:border-border hover:bg-card"
							>
								<div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-border bg-card transition-colors group-hover:border-border">
									<feature.icon className="size-5 text-muted-foreground" />
								</div>
								<h3 className="mb-2 font-semibold">{feature.title}</h3>
								<p className="text-sm text-muted-foreground">{feature.description}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Code Example */}
			<section className="border-b border-border py-24">
				<div className="mx-auto max-w-6xl px-6">
					<div className="grid items-center gap-12 lg:grid-cols-2">
						{/* Left content */}
						<div>
							<h2 className="mb-4 text-2xl font-bold md:text-3xl">Simple Integration</h2>
							<p className="mb-8 text-muted-foreground">
								Add the plugin to your Better Auth configuration. No complex setup or database
								migrations required.
							</p>

							<ul className="space-y-4">
								{[
									"Drop-in plugin architecture",
									"Automatic cookie-based attribution",
									"Built-in REST & tRPC endpoints",
									"Works with any database adapter",
								].map((item) => (
									<li key={item} className="flex items-center gap-3 text-sm">
										<div className="flex size-5 items-center justify-center rounded-full bg-muted">
											<ChevronRight className="size-3 text-muted-foreground" />
										</div>
										<span>{item}</span>
									</li>
								))}
							</ul>
						</div>

						{/* Code block */}
						<CodeBlock code={codeExample} language="typescript" filename="auth.ts" />
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-24">
				<div className="mx-auto max-w-6xl px-6">
					<div className="rounded-2xl border border-border bg-card p-8 text-center md:p-16">
						<h2 className="mb-4 text-2xl font-bold md:text-3xl">Ready to get started?</h2>
						<p className="mb-8 text-muted-foreground">
							See the interactive demo with real components and live data.
						</p>
						<Link href="/demo">
							<Button size="lg">
								Launch Demo
								<ArrowRight className="size-4" />
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t border-border py-8">
				<div className="mx-auto max-w-6xl px-6">
					<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
						<div className="flex items-center gap-3">
							<div className="flex size-6 items-center justify-center rounded bg-foreground">
								<Link2 className="size-3 text-background" />
							</div>
							<span className="text-sm text-muted-foreground">better-auth-affiliates</span>
						</div>
						<div className="flex items-center gap-6 text-sm text-muted-foreground">
							<Link href="https://github.com" className="transition-colors hover:text-foreground">
								GitHub
							</Link>
							<Link href="#" className="transition-colors hover:text-foreground">
								Documentation
							</Link>
							<span>MIT License</span>
						</div>
					</div>
				</div>
			</footer>
		</div>
	)
}
