import type { BetterAuthClientPlugin } from "better-auth/client"
import type { affiliatePlugin } from "./index.js"

type AffiliatePlugin = typeof affiliatePlugin

/**
 * Client plugin for affiliate system
 *
 * Usage:
 * ```ts
 * import { createAuthClient } from "better-auth/client";
 * import { affiliateClientPlugin } from "better-auth-affiliates/client";
 *
 * const authClient = createAuthClient({
 *   plugins: [affiliateClientPlugin()]
 * });
 *
 * // Create affiliate link
 * await authClient.affiliate.createLink({
 *   code: "SARAH2025",
 *   name: "Instagram Link"
 * });
 *
 * // Track click (usually done on landing page)
 * await authClient.affiliate.trackClick({ code: "SARAH2025" });
 *
 * // Get stats
 * const stats = await authClient.affiliate.getStats();
 * ```
 */
export const affiliateClientPlugin = () => {
	return {
		id: "affiliate",
		$InferServerPlugin: {} as ReturnType<AffiliatePlugin>,

		getActions: ($fetch) => ({
			/**
			 * Create a new affiliate link
			 */
			createLink: async (data: {
				code: string
				name?: string
				organizationId?: string
			}) => {
				return await $fetch("/affiliate/create-link", {
					method: "POST",
					body: data,
				})
			},

			/**
			 * Get all affiliate links for current user or organization
			 */
			getLinks: async (data?: { organizationId?: string }) => {
				const params = new URLSearchParams()
				if (data?.organizationId) {
					params.set("organizationId", data.organizationId)
				}
				return await $fetch(`/affiliate/links?${params.toString()}`, {
					method: "GET",
				})
			},

			/**
			 * Track an affiliate link click (public - no auth required)
			 */
			trackClick: async (data: { code: string }) => {
				return await $fetch("/affiliate/track-click", {
					method: "POST",
					body: data,
				})
			},

			/**
			 * Get affiliate stats for current user or organization
			 */
			getStats: async (data?: { organizationId?: string; linkId?: string }) => {
				const params = new URLSearchParams()
				if (data?.organizationId) {
					params.set("organizationId", data.organizationId)
				}
				if (data?.linkId) {
					params.set("linkId", data.linkId)
				}
				return await $fetch(`/affiliate/stats?${params.toString()}`, {
					method: "GET",
				})
			},

			/**
			 * Deactivate an affiliate link
			 */
			deactivateLink: async (data: { linkId: string }) => {
				return await $fetch("/affiliate/deactivate-link", {
					method: "POST",
					body: data,
				})
			},

			/**
			 * Record a conversion (typically called from payment webhook handler)
			 * This marks a referral as converted and calculates commission
			 */
			recordConversion: async (data: {
				referredUserId: string
				paymentAmount: string
			}) => {
				return await $fetch("/affiliate/record-conversion", {
					method: "POST",
					body: data,
				})
			},

			/**
			 * Mark commissions as paid (for payout processing)
			 */
			markCommissionsPaid: async (data: { referralIds: string[] }) => {
				return await $fetch("/affiliate/mark-paid", {
					method: "POST",
					body: data,
				})
			},
		}),
	} satisfies BetterAuthClientPlugin
}
