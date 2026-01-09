import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency = "USD"): string {
	const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(numAmount)
}

export function formatPercentage(value: number | string): string {
	const numValue = typeof value === "string" ? Number.parseFloat(value) : value
	return `${numValue.toFixed(2)}%`
}

export function formatNumber(value: number): string {
	return new Intl.NumberFormat("en-US").format(value)
}

export function generateAffiliateUrl(baseUrl: string, code: string): string {
	const url = new URL(baseUrl)
	url.searchParams.set("ref", code)
	return url.toString()
}

export function copyToClipboard(text: string): Promise<void> {
	return navigator.clipboard.writeText(text)
}
