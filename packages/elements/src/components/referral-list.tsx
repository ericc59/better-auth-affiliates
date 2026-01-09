"use client"

import { cn, formatCurrency } from "@workspace/elements/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { CheckCircle2, Clock, User, XCircle } from "lucide-react"

export interface Referral {
	id: string
	email?: string
	status: "pending" | "converted" | "paid" | "rejected"
	amount?: string | number
	createdAt: Date | string
	paidAt?: Date | string | null
}

export interface ReferralListProps extends React.HTMLAttributes<HTMLDivElement> {
	referrals: Referral[]
	currency?: string
	emptyMessage?: string
}

const statusConfig = {
	pending: {
		icon: Clock,
		label: "Pending",
		variant: "warning" as const,
	},
	converted: {
		icon: CheckCircle2,
		label: "Converted",
		variant: "info" as const,
	},
	paid: {
		icon: CheckCircle2,
		label: "Paid",
		variant: "success" as const,
	},
	rejected: {
		icon: XCircle,
		label: "Rejected",
		variant: "destructive" as const,
	},
}

export function ReferralList({
	className,
	referrals,
	currency = "USD",
	emptyMessage = "No referrals yet",
	...props
}: ReferralListProps) {
	if (referrals.length === 0) {
		return (
			<Card className={cn(className)} data-slot="referral-list" {...props}>
				<CardContent className="flex flex-col items-center justify-center py-12 text-center">
					<User className="size-12 text-muted-foreground/50" />
					<p className="mt-4 text-muted-foreground">{emptyMessage}</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className={cn(className)} data-slot="referral-list" {...props}>
			<CardHeader>
				<CardTitle>Recent Referrals</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				<div className="divide-y">
					{referrals.map((referral) => {
						const status = statusConfig[referral.status]
						const StatusIcon = status.icon

						return (
							<div key={referral.id} className="flex items-center justify-between px-6 py-4">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-full bg-muted">
										<User className="size-5 text-muted-foreground" />
									</div>
									<div>
										<p className="font-medium">
											{referral.email || `Referral #${referral.id.slice(0, 8)}`}
										</p>
										<p className="text-sm text-muted-foreground">
											{new Date(referral.createdAt).toLocaleDateString()}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-4">
									{referral.amount && (
										<span className="font-medium">{formatCurrency(referral.amount, currency)}</span>
									)}
									<Badge variant={status.variant} className="gap-1">
										<StatusIcon className="size-3" />
										{status.label}
									</Badge>
								</div>
							</div>
						)
					})}
				</div>
			</CardContent>
		</Card>
	)
}
