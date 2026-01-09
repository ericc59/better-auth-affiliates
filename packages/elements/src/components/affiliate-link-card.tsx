"use client"

import { cn, copyToClipboard, generateAffiliateUrl } from "@workspace/elements/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Check, Copy, ExternalLink, Link2 } from "lucide-react"
import { useCallback, useState } from "react"

export interface AffiliateLinkCardProps extends React.HTMLAttributes<HTMLDivElement> {
	code: string
	name?: string | null
	baseUrl: string
	isActive?: boolean
	expiresAt?: Date | null
}

export function AffiliateLinkCard({
	className,
	code,
	name,
	baseUrl,
	isActive = true,
	expiresAt,
	...props
}: AffiliateLinkCardProps) {
	const [copied, setCopied] = useState(false)
	const affiliateUrl = generateAffiliateUrl(baseUrl, code)

	const handleCopy = useCallback(async () => {
		await copyToClipboard(affiliateUrl)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}, [affiliateUrl])

	const isExpired = expiresAt ? new Date(expiresAt) < new Date() : false

	return (
		<Card
			className={cn(
				!isActive && "opacity-60",
				isExpired && "border-destructive/50",
				className,
			)}
			data-slot="affiliate-link-card"
			{...props}
		>
			<CardHeader className="flex-row items-start justify-between space-y-0">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
						<Link2 className="size-5 text-primary" />
					</div>
					<div>
						<CardTitle className="text-base">{name || code}</CardTitle>
						<p className="text-sm text-muted-foreground">Code: {code}</p>
					</div>
				</div>
				<Badge variant={isActive && !isExpired ? "success" : "destructive"}>
					{isActive && !isExpired ? "Active" : isExpired ? "Expired" : "Inactive"}
				</Badge>
			</CardHeader>

			<CardContent>
				<p className="mb-2 text-xs font-medium text-muted-foreground">Affiliate URL</p>
				<div className="flex items-center gap-2">
					<div className="flex-1 truncate rounded-lg border bg-muted/50 px-3 py-2 font-mono text-sm">
						{affiliateUrl}
					</div>
					<Button
						variant="outline"
						size="icon"
						onClick={handleCopy}
						aria-label="Copy link"
					>
						{copied ? (
							<Check className="size-4 text-emerald-600" />
						) : (
							<Copy className="size-4" />
						)}
					</Button>
					<Button
						variant="outline"
						size="icon"
						asChild
					>
						<a
							href={affiliateUrl}
							target="_blank"
							rel="noopener noreferrer"
							aria-label="Open link"
						>
							<ExternalLink className="size-4" />
						</a>
					</Button>
				</div>

				{expiresAt && (
					<p className="mt-3 text-xs text-muted-foreground">
						{isExpired ? "Expired" : "Expires"}: {new Date(expiresAt).toLocaleDateString()}
					</p>
				)}
			</CardContent>
		</Card>
	)
}
