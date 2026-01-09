"use client"

import { cn, formatCurrency } from "@workspace/elements/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Banknote, Clock, Wallet } from "lucide-react"

export interface EarningsSummaryProps extends React.HTMLAttributes<HTMLDivElement> {
	totalEarned: string | number
	pendingEarnings?: string | number
	availableForPayout?: string | number
	currency?: string
}

export function EarningsSummary({
	className,
	totalEarned,
	pendingEarnings = 0,
	availableForPayout = 0,
	currency = "USD",
	...props
}: EarningsSummaryProps) {
	return (
		<Card className={cn(className)} data-slot="earnings-summary" {...props}>
			<CardHeader>
				<CardTitle>Earnings Summary</CardTitle>
			</CardHeader>

			<CardContent>
				<div className="grid gap-6 sm:grid-cols-3">
					<div className="flex items-start gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
							<Wallet className="size-5 text-emerald-600 dark:text-emerald-400" />
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Total Earned</p>
							<p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
								{formatCurrency(totalEarned, currency)}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
							<Clock className="size-5 text-amber-600 dark:text-amber-400" />
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Pending</p>
							<p className="text-xl font-bold text-amber-600 dark:text-amber-400">
								{formatCurrency(pendingEarnings, currency)}
							</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
							<Banknote className="size-5 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<p className="text-sm text-muted-foreground">Available</p>
							<p className="text-xl font-bold text-blue-600 dark:text-blue-400">
								{formatCurrency(availableForPayout, currency)}
							</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
