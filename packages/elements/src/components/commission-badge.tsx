import { formatCurrency, formatPercentage } from "@workspace/elements/lib/utils"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"
import { type VariantProps, cva } from "class-variance-authority"

const commissionBadgeSizeVariants = cva("", {
	variants: {
		size: {
			sm: "px-2 py-0.5 text-xs",
			default: "px-3 py-1 text-sm",
			lg: "px-4 py-1.5 text-base",
		},
	},
	defaultVariants: {
		size: "default",
	},
})

export interface CommissionBadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof commissionBadgeSizeVariants> {
	type: "percentage" | "fixed"
	rate: string | number
	fixedAmount?: string | number | null
	currency?: string
}

export function CommissionBadge({
	className,
	type,
	rate,
	fixedAmount,
	currency = "USD",
	size,
	...props
}: CommissionBadgeProps) {
	const displayValue =
		type === "percentage" ? formatPercentage(rate) : formatCurrency(fixedAmount || rate, currency)

	return (
		<Badge
			variant={type === "percentage" ? "info" : "secondary"}
			className={cn(commissionBadgeSizeVariants({ size }), "gap-1.5", className)}
			data-slot="commission-badge"
			{...props}
		>
			{displayValue}
			<span className="opacity-70">{type === "percentage" ? "commission" : "per referral"}</span>
		</Badge>
	)
}

export { commissionBadgeSizeVariants }
