"use client"

import { cn, formatCurrency, formatNumber } from "@workspace/elements/lib/utils"
import { Card, CardContent } from "@workspace/ui/components/card"
import { type VariantProps, cva } from "class-variance-authority"
import {
	ArrowDownRight,
	ArrowUpRight,
	DollarSign,
	MousePointerClick,
	TrendingUp,
	Users,
} from "lucide-react"

const statsCardVariants = cva("", {
	variants: {
		variant: {
			default: "",
			success: "border-emerald-200 dark:border-emerald-800",
			warning: "border-amber-200 dark:border-amber-800",
			primary: "border-blue-200 dark:border-blue-800",
		},
	},
	defaultVariants: {
		variant: "default",
	},
})

const iconContainerVariants = cva(
	"flex size-12 items-center justify-center rounded-xl transition-colors",
	{
		variants: {
			variant: {
				default: "bg-muted text-muted-foreground",
				success: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400",
				warning: "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400",
				primary: "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
)

export interface AffiliateStatsCardProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof statsCardVariants> {
	title: string
	value: string | number
	description?: string
	icon?: "clicks" | "signups" | "earnings" | "conversion"
	trend?: {
		value: number
		isPositive: boolean
	}
	format?: "number" | "currency" | "percentage"
}

const iconMap = {
	clicks: MousePointerClick,
	signups: Users,
	earnings: DollarSign,
	conversion: TrendingUp,
}

export function AffiliateStatsCard({
	className,
	variant,
	title,
	value,
	description,
	icon = "clicks",
	trend,
	format = "number",
	...props
}: AffiliateStatsCardProps) {
	const Icon = iconMap[icon]

	const formattedValue = (() => {
		if (format === "currency") return formatCurrency(value)
		if (format === "percentage") return `${value}%`
		return formatNumber(Number(value))
	})()

	return (
		<Card
			className={cn(statsCardVariants({ variant }), className)}
			data-slot="stats-card"
			{...props}
		>
			<CardContent className="p-6">
				<div className="flex items-start justify-between">
					<div className={cn(iconContainerVariants({ variant }))}>
						<Icon className="size-6" />
					</div>
					{trend && (
						<div
							className={cn(
								"flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
								trend.isPositive
									? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
									: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400",
							)}
						>
							{trend.isPositive ? (
								<ArrowUpRight className="size-3.5" />
							) : (
								<ArrowDownRight className="size-3.5" />
							)}
							{trend.value}%
						</div>
					)}
				</div>

				<div className="mt-4">
					<p className="text-sm font-medium text-muted-foreground">{title}</p>
					<p className="mt-1 text-3xl font-bold tracking-tight">{formattedValue}</p>
				</div>

				{description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
			</CardContent>
		</Card>
	)
}

export { statsCardVariants }
