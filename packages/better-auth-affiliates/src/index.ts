import type { BetterAuthPlugin } from "better-auth"
import {
	APIError,
	createAuthEndpoint,
	createAuthMiddleware,
	sessionMiddleware,
} from "better-auth/api"
import { z } from "zod"

/**
 * Affiliate link record type
 */
export interface AffiliateLink {
	id: string
	code: string
	name: string | null
	userId: string | null
	organizationId: string | null
	commissionRate: string
	commissionType: "percentage" | "fixed"
	fixedAmount: string | null
	clickCount: number
	signupCount: number
	paidReferralCount: number
	totalEarned: string
	isActive: boolean
	expiresAt: Date | null
	createdAt: Date
	updatedAt: Date
}

/**
 * Referral record type
 */
export interface Referral {
	id: string
	affiliateLinkId: string
	referrerId: string | null
	referrerOrganizationId: string | null
	referredUserId: string
	stripeCustomerId: string | null
	status: "pending" | "active" | "churned" | "expired"
	commissionEarned: string
	commissionPaid: boolean
	signedUpAt: Date
	convertedAt: Date | null
	expiresAt: Date | null
	createdAt: Date
	updatedAt: Date
}

/**
 * Commission record for tracking individual payments (especially recurring)
 */
export interface AffiliateCommission {
	id: string
	referralId: string
	affiliateLinkId: string
	amount: string
	paymentAmount: string
	stripeInvoiceId: string | null
	stripePaymentIntentId: string | null
	type: "initial" | "recurring"
	status: "pending" | "approved" | "paid" | "rejected"
	paidAt: Date | null
	createdAt: Date
	updatedAt: Date
}

/**
 * Commission tier for performance-based rates
 */
export interface CommissionTier {
	/**
	 * Minimum number of paid referrals to reach this tier
	 */
	minPaidReferrals: number
	/**
	 * Commission rate for this tier
	 * For percentage: "30.00" = 30%
	 * For fixed: dollar amount
	 */
	rate: string
	/**
	 * Optional tier name (e.g., "Bronze", "Silver", "Gold")
	 */
	name?: string
}

export interface AffiliatePluginOptions {
	/**
	 * Default commission rate for all affiliate links
	 * For percentage: "30.00" = 30%
	 * For fixed: dollar amount
	 */
	commissionRate: string
	/**
	 * Commission type: percentage or fixed amount
	 */
	commissionType: "percentage" | "fixed"
	/**
	 * Optional commission tiers for performance-based rates
	 * Tiers are checked in order - the highest qualifying tier is used
	 * Example:
	 * ```
	 * commissionTiers: [
	 *   { minPaidReferrals: 0, rate: "20.00", name: "Bronze" },
	 *   { minPaidReferrals: 10, rate: "25.00", name: "Silver" },
	 *   { minPaidReferrals: 50, rate: "30.00", name: "Gold" },
	 * ]
	 * ```
	 */
	commissionTiers?: CommissionTier[]
	/**
	 * Duration in months for recurring commissions (for percentage type)
	 * Example: 12 = earn commission for 12 months
	 */
	commissionDurationMonths?: number
	/**
	 * Cookie duration in days (how long to attribute referrals)
	 * Default: 30 days
	 */
	cookieDurationDays?: number
	/**
	 * Optional callback when a referral signup occurs
	 * Use this to send email notifications or trigger other actions
	 */
	onReferralSignup?: (data: {
		affiliateLink: AffiliateLink
		referredUser: { id: string; name?: string | null; email?: string | null }
		affiliateCode: string
	}) => Promise<void>
	/**
	 * Optional callback when a referral converts (first payment)
	 * Use this to send email notifications or trigger other actions
	 */
	onReferralConversion?: (data: {
		referral: Referral
		affiliateLink: AffiliateLink
		commissionAmount: string
	}) => Promise<void>
	/**
	 * Optional callback when a recurring commission is recorded
	 */
	onRecurringCommission?: (data: {
		referral: Referral
		affiliateLink: AffiliateLink
		commission: AffiliateCommission
	}) => Promise<void>
	/**
	 * Optional callback when an affiliate reaches a new tier
	 */
	onTierUpgrade?: (data: {
		affiliateLink: AffiliateLink
		previousTier: CommissionTier | null
		newTier: CommissionTier
	}) => Promise<void>
}

/**
 * Get the current tier for an affiliate based on their performance
 * Returns the highest tier they qualify for, or null if no tiers configured
 */
export function getTierForAffiliate(
	paidReferralCount: number,
	tiers?: CommissionTier[],
): CommissionTier | null {
	if (!tiers || tiers.length === 0) return null

	// Sort tiers by minPaidReferrals descending to find highest qualifying tier
	const sortedTiers = [...tiers].sort((a, b) => b.minPaidReferrals - a.minPaidReferrals)

	for (const tier of sortedTiers) {
		if (paidReferralCount >= tier.minPaidReferrals) {
			return tier
		}
	}

	// Return lowest tier if none match (shouldn't happen if tier with minPaidReferrals: 0 exists)
	return sortedTiers[sortedTiers.length - 1] || null
}

/**
 * Get the next tier an affiliate can reach
 * Returns null if already at highest tier or no tiers configured
 */
export function getNextTier(
	paidReferralCount: number,
	tiers?: CommissionTier[],
): { tier: CommissionTier; referralsNeeded: number } | null {
	if (!tiers || tiers.length === 0) return null

	// Sort tiers by minPaidReferrals ascending
	const sortedTiers = [...tiers].sort((a, b) => a.minPaidReferrals - b.minPaidReferrals)

	for (const tier of sortedTiers) {
		if (tier.minPaidReferrals > paidReferralCount) {
			return {
				tier,
				referralsNeeded: tier.minPaidReferrals - paidReferralCount,
			}
		}
	}

	return null // Already at highest tier
}

/**
 * Calculate commission amount based on link settings and optional tier
 */
export function calculateCommission(
	link: AffiliateLink,
	paymentAmount: string | number,
	options?: {
		tiers?: CommissionTier[]
		overrideRate?: string
	},
): string {
	// Determine the rate to use
	let rate: string
	if (options?.overrideRate) {
		rate = options.overrideRate
	} else if (options?.tiers && options.tiers.length > 0) {
		const currentTier = getTierForAffiliate(link.paidReferralCount || 0, options.tiers)
		rate = currentTier?.rate || link.commissionRate
	} else {
		rate = link.commissionRate
	}

	if (link.commissionType === "percentage") {
		const rateNum = Number.parseFloat(rate) / 100
		const payment = Number.parseFloat(String(paymentAmount))
		return (payment * rateNum).toFixed(2)
	}
	return link.fixedAmount || rate
}

/**
 * Parse affiliate code from various sources
 */
export function parseAffiliateCode(request?: Request | null): string | null {
	if (!request) return null

	// Check cookie
	const cookieHeader = request.headers.get("cookie")
	if (cookieHeader) {
		const match = cookieHeader.match(/affiliateCode=([^;]+)/)
		if (match?.[1]) return match[1]
	}

	// Check header
	const headerCode = request.headers.get("x-affiliate-code")
	if (headerCode) return headerCode

	return null
}

/**
 * Better Auth Affiliate Plugin
 *
 * Features:
 * - Create and manage multiple affiliate links per user/organization
 * - Track referral clicks, signups, and conversions
 * - Calculate commissions on subscription payments
 * - Support both user-level and organization-level affiliates
 * - Stripe integration for automatic conversion tracking
 * - Works with any database adapter supported by Better Auth
 */
export const affiliatePlugin = (options: AffiliatePluginOptions) => {
	const {
		commissionRate,
		commissionType,
		commissionTiers,
		commissionDurationMonths = 12,
		cookieDurationDays = 30,
		onReferralSignup,
		onReferralConversion,
		onRecurringCommission,
		onTierUpgrade,
	} = options

	return {
		id: "affiliate",

		/**
		 * Database schema for affiliate tables
		 * Better Auth will automatically create these tables
		 */
		schema: {
			affiliateLink: {
				fields: {
					code: {
						type: "string" as const,
						required: true,
						unique: true,
					},
					name: {
						type: "string" as const,
						required: false,
					},
					userId: {
						type: "string" as const,
						required: false,
						references: {
							model: "user",
							field: "id",
							onDelete: "cascade" as const,
						},
					},
					organizationId: {
						type: "string" as const,
						required: false,
						references: {
							model: "organization",
							field: "id",
							onDelete: "cascade" as const,
						},
					},
					commissionRate: {
						type: "string" as const,
						required: true,
					},
					commissionType: {
						type: "string" as const,
						required: true,
					},
					fixedAmount: {
						type: "string" as const,
						required: false,
					},
					clickCount: {
						type: "number" as const,
						required: false,
					},
					signupCount: {
						type: "number" as const,
						required: false,
					},
					paidReferralCount: {
						type: "number" as const,
						required: false,
					},
					totalEarned: {
						type: "string" as const,
						required: false,
					},
					isActive: {
						type: "boolean" as const,
						required: false,
					},
					expiresAt: {
						type: "date" as const,
						required: false,
					},
				},
			},
			referral: {
				fields: {
					affiliateLinkId: {
						type: "string" as const,
						required: true,
						references: {
							model: "affiliateLink",
							field: "id",
							onDelete: "cascade" as const,
						},
					},
					referrerId: {
						type: "string" as const,
						required: false,
						references: {
							model: "user",
							field: "id",
							onDelete: "set null" as const,
						},
					},
					referrerOrganizationId: {
						type: "string" as const,
						required: false,
						references: {
							model: "organization",
							field: "id",
							onDelete: "set null" as const,
						},
					},
					referredUserId: {
						type: "string" as const,
						required: true,
						unique: true,
						references: {
							model: "user",
							field: "id",
							onDelete: "cascade" as const,
						},
					},
					stripeCustomerId: {
						type: "string" as const,
						required: false,
					},
					status: {
						type: "string" as const,
						required: false,
					},
					commissionEarned: {
						type: "string" as const,
						required: false,
					},
					commissionPaid: {
						type: "boolean" as const,
						required: false,
					},
					signedUpAt: {
						type: "date" as const,
						required: true,
					},
					convertedAt: {
						type: "date" as const,
						required: false,
					},
					expiresAt: {
						type: "date" as const,
						required: false,
					},
				},
			},
			affiliateCommission: {
				fields: {
					referralId: {
						type: "string" as const,
						required: true,
						references: {
							model: "referral",
							field: "id",
							onDelete: "cascade" as const,
						},
					},
					affiliateLinkId: {
						type: "string" as const,
						required: true,
						references: {
							model: "affiliateLink",
							field: "id",
							onDelete: "cascade" as const,
						},
					},
					amount: {
						type: "string" as const,
						required: true,
					},
					paymentAmount: {
						type: "string" as const,
						required: true,
					},
					stripeInvoiceId: {
						type: "string" as const,
						required: false,
					},
					stripePaymentIntentId: {
						type: "string" as const,
						required: false,
					},
					type: {
						type: "string" as const,
						required: true,
					},
					status: {
						type: "string" as const,
						required: false,
					},
					paidAt: {
						type: "date" as const,
						required: false,
					},
				},
			},
		},

		endpoints: {
			/**
			 * Create a new affiliate link
			 * POST /api/auth/affiliate/create-link
			 */
			createAffiliateLink: createAuthEndpoint(
				"/affiliate/create-link",
				{
					method: "POST",
					use: [sessionMiddleware],
					body: z.object({
						code: z
							.string()
							.min(3)
							.max(50)
							.regex(/^[A-Za-z0-9_-]+$/, "Code must be alphanumeric with dashes/underscores only"),
						name: z.string().optional(),
						organizationId: z.string().optional(),
					}),
				},
				async (ctx) => {
					const adapter = ctx.context.adapter
					const userId = ctx.context.session.user.id
					const { code, name, organizationId } = ctx.body

					// Check if code already exists
					const existing = await adapter.findOne<AffiliateLink>({
						model: "affiliateLink",
						where: [{ field: "code", value: code }],
					})

					if (existing) {
						throw new APIError("BAD_REQUEST", {
							message: "This affiliate code is already taken",
						})
					}

					// Create the affiliate link with plugin-configured commission settings
					const now = new Date()
					const link = await adapter.create<AffiliateLink>({
						model: "affiliateLink",
						data: {
							code,
							name: name || null,
							userId: organizationId ? null : userId,
							organizationId: organizationId || null,
							commissionRate,
							commissionType,
							fixedAmount: commissionType === "fixed" ? commissionRate : null,
							clickCount: 0,
							signupCount: 0,
							paidReferralCount: 0,
							totalEarned: "0",
							isActive: true,
							expiresAt: null,
							createdAt: now,
							updatedAt: now,
						},
					})

					return ctx.json({
						success: true,
						link,
					})
				},
			),

			/**
			 * Get all affiliate links for current user/organization
			 * GET /api/auth/affiliate/links
			 */
			getAffiliateLinks: createAuthEndpoint(
				"/affiliate/links",
				{
					method: "GET",
					use: [sessionMiddleware],
					query: z.object({
						organizationId: z.string().optional(),
					}),
				},
				async (ctx) => {
					const adapter = ctx.context.adapter
					const userId = ctx.context.session.user.id
					const { organizationId } = ctx.query || {}

					// Get links for user or organization
					const links = await adapter.findMany<AffiliateLink>({
						model: "affiliateLink",
						where: organizationId
							? [{ field: "organizationId", value: organizationId }]
							: [{ field: "userId", value: userId }],
						sortBy: { field: "createdAt", direction: "desc" },
					})

					return ctx.json({
						success: true,
						links,
					})
				},
			),

			/**
			 * Track affiliate link click (public endpoint - no auth required)
			 * POST /api/auth/affiliate/track-click
			 */
			trackAffiliateClick: createAuthEndpoint(
				"/affiliate/track-click",
				{
					method: "POST",
					body: z.object({
						code: z.string(),
					}),
				},
				async (ctx) => {
					const adapter = ctx.context.adapter
					const { code } = ctx.body

					// Find the affiliate link
					const link = await adapter.findOne<AffiliateLink>({
						model: "affiliateLink",
						where: [
							{ field: "code", value: code },
							{ field: "isActive", value: true },
						],
					})

					if (!link) {
						throw new APIError("NOT_FOUND", {
							message: "Affiliate link not found or inactive",
						})
					}

					// Check if expired
					if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
						throw new APIError("BAD_REQUEST", {
							message: "This affiliate link has expired",
						})
					}

					// Increment click count
					await adapter.update<AffiliateLink>({
						model: "affiliateLink",
						where: [{ field: "id", value: link.id }],
						update: {
							clickCount: (link.clickCount || 0) + 1,
						},
					})

					return ctx.json({
						success: true,
						affiliateLinkId: link.id,
						cookieDurationDays,
					})
				},
			),

			/**
			 * Get affiliate stats
			 * GET /api/auth/affiliate/stats
			 */
			getAffiliateStats: createAuthEndpoint(
				"/affiliate/stats",
				{
					method: "GET",
					use: [sessionMiddleware],
					query: z.object({
						organizationId: z.string().optional(),
						linkId: z.string().optional(),
					}),
				},
				async (ctx) => {
					const adapter = ctx.context.adapter
					const userId = ctx.context.session.user.id
					const { organizationId, linkId } = ctx.query || {}

					// Build where clause based on query params
					type WhereClause = { field: string; value: string }
					let linksWhere: WhereClause[]
					if (linkId) {
						linksWhere = [{ field: "id", value: linkId }]
					} else if (organizationId) {
						linksWhere = [{ field: "organizationId", value: organizationId }]
					} else {
						linksWhere = [{ field: "userId", value: userId }]
					}

					// Get aggregate stats
					const links = await adapter.findMany<AffiliateLink>({
						model: "affiliateLink",
						where: linksWhere,
					})

					const totalClicks = links.reduce((sum, link) => sum + (Number(link.clickCount) || 0), 0)
					const totalSignups = links.reduce((sum, link) => sum + (Number(link.signupCount) || 0), 0)
					const totalPaidReferrals = links.reduce(
						(sum, link) => sum + (Number(link.paidReferralCount) || 0),
						0,
					)
					const totalEarned = links.reduce((sum, link) => sum + (Number(link.totalEarned) || 0), 0)

					// Get recent referrals
					const recentReferrals = await adapter.findMany<Referral>({
						model: "referral",
						where: organizationId
							? [{ field: "referrerOrganizationId", value: organizationId }]
							: [{ field: "referrerId", value: userId }],
						sortBy: { field: "createdAt", direction: "desc" },
						limit: 10,
					})

					// Get unpaid commission from commission records
					const linkIds = links.map((l) => l.id)
					let unpaidCommission = 0

					for (const lid of linkIds) {
						const unpaidCommissions = await adapter.findMany<AffiliateCommission>({
							model: "affiliateCommission",
							where: [
								{ field: "affiliateLinkId", value: lid },
								{ field: "status", value: "approved" },
							],
						})
						unpaidCommission += unpaidCommissions.reduce(
							(sum, c) => sum + (Number(c.amount) || 0),
							0,
						)
					}

					// Calculate tier information if tiers are configured
					const currentTier = getTierForAffiliate(totalPaidReferrals, commissionTiers)
					const nextTierInfo = getNextTier(totalPaidReferrals, commissionTiers)

					return ctx.json({
						success: true,
						stats: {
							totalClicks,
							totalSignups,
							totalPaidReferrals,
							totalEarned,
							unpaidCommission,
							conversionRate:
								totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(2) : "0.00",
							links: links.map((link) => {
								const linkTier = getTierForAffiliate(link.paidReferralCount || 0, commissionTiers)
								return {
									id: link.id,
									code: link.code,
									name: link.name,
									clicks: link.clickCount,
									signups: link.signupCount,
									paidReferrals: link.paidReferralCount,
									earned: link.totalEarned,
									currentTier: linkTier
										? { name: linkTier.name, rate: linkTier.rate }
										: null,
								}
							}),
							recentReferrals,
							// Tier information (aggregate across all links)
							currentTier: currentTier
								? {
										name: currentTier.name,
										rate: currentTier.rate,
										minPaidReferrals: currentTier.minPaidReferrals,
									}
								: null,
							nextTier: nextTierInfo
								? {
										name: nextTierInfo.tier.name,
										rate: nextTierInfo.tier.rate,
										minPaidReferrals: nextTierInfo.tier.minPaidReferrals,
										referralsNeeded: nextTierInfo.referralsNeeded,
									}
								: null,
							tiersEnabled: Boolean(commissionTiers && commissionTiers.length > 0),
						},
					})
				},
			),

			/**
			 * Get commission history
			 * GET /api/auth/affiliate/commissions
			 */
			getCommissions: createAuthEndpoint(
				"/affiliate/commissions",
				{
					method: "GET",
					use: [sessionMiddleware],
					query: z.object({
						organizationId: z.string().optional(),
						linkId: z.string().optional(),
						status: z.enum(["pending", "approved", "paid", "rejected"]).optional(),
						limit: z.string().optional(),
						offset: z.string().optional(),
					}),
				},
				async (ctx) => {
					const adapter = ctx.context.adapter
					const userId = ctx.context.session.user.id
					const { organizationId, linkId, status, limit, offset } = ctx.query || {}

					// Get links for user/org
					type WhereClause = { field: string; value: string | boolean }
					let linksWhere: WhereClause[]
					if (linkId) {
						linksWhere = [{ field: "id", value: linkId }]
					} else if (organizationId) {
						linksWhere = [{ field: "organizationId", value: organizationId }]
					} else {
						linksWhere = [{ field: "userId", value: userId }]
					}

					const links = await adapter.findMany<AffiliateLink>({
						model: "affiliateLink",
						where: linksWhere,
					})

					const linkIds = links.map((l) => l.id)
					const allCommissions: AffiliateCommission[] = []

					for (const lid of linkIds) {
						const where: WhereClause[] = [{ field: "affiliateLinkId", value: lid }]
						if (status) {
							where.push({ field: "status", value: status })
						}

						const commissions = await adapter.findMany<AffiliateCommission>({
							model: "affiliateCommission",
							where,
							sortBy: { field: "createdAt", direction: "desc" },
							limit: limit ? Number.parseInt(limit) : 50,
							offset: offset ? Number.parseInt(offset) : 0,
						})
						allCommissions.push(...commissions)
					}

					// Sort by createdAt desc
					allCommissions.sort(
						(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
					)

					return ctx.json({
						success: true,
						commissions: allCommissions.slice(0, limit ? Number.parseInt(limit) : 50),
					})
				},
			),

			/**
			 * Deactivate an affiliate link
			 * POST /api/auth/affiliate/deactivate-link
			 */
			deactivateAffiliateLink: createAuthEndpoint(
				"/affiliate/deactivate-link",
				{
					method: "POST",
					use: [sessionMiddleware],
					body: z.object({
						linkId: z.string(),
					}),
				},
				async (ctx) => {
					const adapter = ctx.context.adapter
					const userId = ctx.context.session.user.id
					const { linkId } = ctx.body

					// Verify ownership
					const link = await adapter.findOne<AffiliateLink>({
						model: "affiliateLink",
						where: [{ field: "id", value: linkId }],
					})

					if (!link) {
						throw new APIError("NOT_FOUND", {
							message: "Affiliate link not found",
						})
					}

					if (link.userId !== userId && link.organizationId) {
						// TODO: Check if user is admin of the organization
						throw new APIError("FORBIDDEN", {
							message: "You don't have permission to deactivate this link",
						})
					}

					// Deactivate
					await adapter.update<AffiliateLink>({
						model: "affiliateLink",
						where: [{ field: "id", value: linkId }],
						update: {
							isActive: false,
						},
					})

					return ctx.json({
						success: true,
					})
				},
			),

			/**
			 * Record a conversion (called when a referral makes their first payment)
			 * POST /api/auth/affiliate/record-conversion
			 * This is typically called from your payment webhook handler
			 */
			recordConversion: createAuthEndpoint(
				"/affiliate/record-conversion",
				{
					method: "POST",
					body: z.object({
						referredUserId: z.string(),
						paymentAmount: z.string(),
						stripeCustomerId: z.string().optional(),
						stripeInvoiceId: z.string().optional(),
						stripePaymentIntentId: z.string().optional(),
					}),
				},
				async (ctx) => {
					const adapter = ctx.context.adapter
					const {
						referredUserId,
						paymentAmount,
						stripeCustomerId,
						stripeInvoiceId,
						stripePaymentIntentId,
					} = ctx.body

					// Find the referral
					const referral = await adapter.findOne<Referral>({
						model: "referral",
						where: [{ field: "referredUserId", value: referredUserId }],
					})

					if (!referral) {
						return ctx.json({
							success: false,
							message: "No referral found for this user",
						})
					}

					// Find the affiliate link
					const link = await adapter.findOne<AffiliateLink>({
						model: "affiliateLink",
						where: [{ field: "id", value: referral.affiliateLinkId }],
					})

					if (!link) {
						return ctx.json({
							success: false,
							message: "Affiliate link not found",
						})
					}

					// Get tier before this conversion (for upgrade detection)
					const previousTier = getTierForAffiliate(link.paidReferralCount || 0, commissionTiers)

					// Calculate commission using tiered rates if configured
					const commissionAmount = calculateCommission(link, paymentAmount, {
						tiers: commissionTiers,
					})

					const now = new Date()
					const expiresAt = new Date()
					expiresAt.setMonth(expiresAt.getMonth() + commissionDurationMonths)

					// Update referral status and store Stripe customer ID
					await adapter.update<Referral>({
						model: "referral",
						where: [{ field: "id", value: referral.id }],
						update: {
							status: "active",
							convertedAt: now,
							commissionEarned: commissionAmount,
							stripeCustomerId: stripeCustomerId || referral.stripeCustomerId,
							expiresAt,
						},
					})

					// Create commission record
					await adapter.create<AffiliateCommission>({
						model: "affiliateCommission",
						data: {
							referralId: referral.id,
							affiliateLinkId: link.id,
							amount: commissionAmount,
							paymentAmount,
							stripeInvoiceId: stripeInvoiceId || null,
							stripePaymentIntentId: stripePaymentIntentId || null,
							type: "initial",
							status: "approved",
							paidAt: null,
							createdAt: now,
							updatedAt: now,
						},
					})

					const newPaidReferralCount = (link.paidReferralCount || 0) + 1

					// Update affiliate link stats
					await adapter.update<AffiliateLink>({
						model: "affiliateLink",
						where: [{ field: "id", value: link.id }],
						update: {
							paidReferralCount: newPaidReferralCount,
							totalEarned: (
								Number.parseFloat(link.totalEarned || "0") + Number.parseFloat(commissionAmount)
							).toFixed(2),
						},
					})

					// Check for tier upgrade
					const newTier = getTierForAffiliate(newPaidReferralCount, commissionTiers)
					const tierUpgraded =
						newTier &&
						(!previousTier || newTier.minPaidReferrals > previousTier.minPaidReferrals)

					// Call tier upgrade callback if applicable
					if (tierUpgraded && onTierUpgrade) {
						try {
							const updatedLink = await adapter.findOne<AffiliateLink>({
								model: "affiliateLink",
								where: [{ field: "id", value: link.id }],
							})
							if (updatedLink) {
								await onTierUpgrade({
									affiliateLink: updatedLink,
									previousTier,
									newTier,
								})
							}
						} catch (error) {
							console.error("[Affiliate] onTierUpgrade callback error:", error)
						}
					}

					// Call optional conversion callback
					if (onReferralConversion) {
						try {
							const updatedReferral = await adapter.findOne<Referral>({
								model: "referral",
								where: [{ field: "id", value: referral.id }],
							})
							if (updatedReferral) {
								await onReferralConversion({
									referral: updatedReferral,
									affiliateLink: link,
									commissionAmount,
								})
							}
						} catch (error) {
							console.error("[Affiliate] onReferralConversion callback error:", error)
						}
					}

					return ctx.json({
						success: true,
						commissionAmount,
					})
				},
			),

			/**
			 * Record a recurring commission (for subscription renewals)
			 * POST /api/auth/affiliate/record-recurring
			 */
			recordRecurringCommission: createAuthEndpoint(
				"/affiliate/record-recurring",
				{
					method: "POST",
					body: z.object({
						stripeCustomerId: z.string().optional(),
						referredUserId: z.string().optional(),
						paymentAmount: z.string(),
						stripeInvoiceId: z.string().optional(),
						stripePaymentIntentId: z.string().optional(),
					}),
				},
				async (ctx) => {
					const adapter = ctx.context.adapter
					const {
						stripeCustomerId,
						referredUserId,
						paymentAmount,
						stripeInvoiceId,
						stripePaymentIntentId,
					} = ctx.body

					// Find the referral by Stripe customer ID or user ID
					let referral: Referral | null = null

					if (stripeCustomerId) {
						referral = await adapter.findOne<Referral>({
							model: "referral",
							where: [{ field: "stripeCustomerId", value: stripeCustomerId }],
						})
					}

					if (!referral && referredUserId) {
						referral = await adapter.findOne<Referral>({
							model: "referral",
							where: [{ field: "referredUserId", value: referredUserId }],
						})
					}

					if (!referral) {
						return ctx.json({
							success: false,
							message: "No referral found",
						})
					}

					// Check if referral is still active and not expired
					if (referral.status !== "active") {
						return ctx.json({
							success: false,
							message: "Referral is not active",
						})
					}

					if (referral.expiresAt && new Date(referral.expiresAt) < new Date()) {
						return ctx.json({
							success: false,
							message: "Commission period has expired",
						})
					}

					// Check for duplicate invoice
					if (stripeInvoiceId) {
						const existingCommission = await adapter.findOne<AffiliateCommission>({
							model: "affiliateCommission",
							where: [{ field: "stripeInvoiceId", value: stripeInvoiceId }],
						})

						if (existingCommission) {
							return ctx.json({
								success: false,
								message: "Commission already recorded for this invoice",
							})
						}
					}

					// Find the affiliate link
					const link = await adapter.findOne<AffiliateLink>({
						model: "affiliateLink",
						where: [{ field: "id", value: referral.affiliateLinkId }],
					})

					if (!link) {
						return ctx.json({
							success: false,
							message: "Affiliate link not found",
						})
					}

					// Calculate commission using tiered rates if configured
					const commissionAmount = calculateCommission(link, paymentAmount, {
						tiers: commissionTiers,
					})

					const now = new Date()

					// Create commission record
					const commission = await adapter.create<AffiliateCommission>({
						model: "affiliateCommission",
						data: {
							referralId: referral.id,
							affiliateLinkId: link.id,
							amount: commissionAmount,
							paymentAmount,
							stripeInvoiceId: stripeInvoiceId || null,
							stripePaymentIntentId: stripePaymentIntentId || null,
							type: "recurring",
							status: "approved",
							paidAt: null,
							createdAt: now,
							updatedAt: now,
						},
					})

					// Update referral total commission
					const newTotal = (
						Number.parseFloat(referral.commissionEarned || "0") +
						Number.parseFloat(commissionAmount)
					).toFixed(2)

					await adapter.update<Referral>({
						model: "referral",
						where: [{ field: "id", value: referral.id }],
						update: {
							commissionEarned: newTotal,
						},
					})

					// Update affiliate link stats
					await adapter.update<AffiliateLink>({
						model: "affiliateLink",
						where: [{ field: "id", value: link.id }],
						update: {
							totalEarned: (
								Number.parseFloat(link.totalEarned || "0") + Number.parseFloat(commissionAmount)
							).toFixed(2),
						},
					})

					// Call optional recurring callback
					if (onRecurringCommission) {
						try {
							await onRecurringCommission({
								referral,
								affiliateLink: link,
								commission,
							})
						} catch (error) {
							console.error("[Affiliate] onRecurringCommission callback error:", error)
						}
					}

					return ctx.json({
						success: true,
						commissionAmount,
						commissionId: commission.id,
					})
				},
			),

			/**
			 * Mark commissions as paid
			 * POST /api/auth/affiliate/mark-paid
			 */
			markCommissionsPaid: createAuthEndpoint(
				"/affiliate/mark-paid",
				{
					method: "POST",
					body: z.object({
						commissionIds: z.array(z.string()).optional(),
						referralIds: z.array(z.string()).optional(),
					}),
				},
				async (ctx) => {
					const adapter = ctx.context.adapter
					const { commissionIds, referralIds } = ctx.body
					const now = new Date()
					let updatedCount = 0

					// Mark commission records as paid
					if (commissionIds && commissionIds.length > 0) {
						for (const commissionId of commissionIds) {
							await adapter.update<AffiliateCommission>({
								model: "affiliateCommission",
								where: [{ field: "id", value: commissionId }],
								update: {
									status: "paid",
									paidAt: now,
								},
							})
							updatedCount++
						}
					}

					// Also support legacy referralIds for backwards compatibility
					if (referralIds && referralIds.length > 0) {
						for (const referralId of referralIds) {
							await adapter.update<Referral>({
								model: "referral",
								where: [{ field: "id", value: referralId }],
								update: {
									commissionPaid: true,
								},
							})
							updatedCount++
						}
					}

					return ctx.json({
						success: true,
						updatedCount,
					})
				},
			),
		},

		hooks: {
			after: [
				{
					// Track referral signup - catches both email and OAuth signups
					matcher: (context) =>
						Boolean(
							context.path?.startsWith("/sign-up") || // Email signup
								context.path?.includes("/callback"), // OAuth callbacks
						),
					handler: createAuthMiddleware(async (ctx) => {
						const adapter = ctx.context.adapter

						// Only process if this is a new user signup (not an existing user signing in)
						if (!ctx.context.newSession?.user) {
							return { context: ctx }
						}

						const newUser = ctx.context.newSession.user
						const newUserId = newUser.id

						// Check if referral already exists first
						// This determines if this is a NEW signup or an existing user signing in
						const existingReferral = await adapter.findOne<Referral>({
							model: "referral",
							where: [{ field: "referredUserId", value: newUserId }],
						})

						// Parse cookies to check for affiliate code
						const cookieHeader = ctx.request?.headers.get("cookie")
						const cookies = cookieHeader
							? Object.fromEntries(
									cookieHeader.split("; ").map((c) => {
										const [key, ...values] = c.split("=")
										return [key, values.join("=")]
									}),
								)
							: {}

						const affiliateCode =
							(ctx.body as { affiliateCode?: string })?.affiliateCode ||
							cookies.affiliateCode ||
							ctx.request?.headers.get("x-affiliate-code")

						// Always clear the cookie if it exists, regardless of whether we create a referral
						// This prevents the cookie from persisting for future sign-ins
						if (affiliateCode) {
							const responseHeaders = ctx.context.responseHeaders || new Headers()
							responseHeaders.append(
								"Set-Cookie",
								"affiliateCode=; Max-Age=0; Path=/; SameSite=Lax; HttpOnly",
							)
						}

						// If referral already exists, this is an existing user signing in (not a signup)
						if (existingReferral) {
							console.log(
								`[Affiliate] User ${newUserId} already has a referral (existing user signing in), skipping`,
							)
							return { context: ctx }
						}

						// Log the new signup attempt
						console.log(
							`[Affiliate] New signup detected - path: ${ctx.path}, code: ${affiliateCode}, newUser: ${newUserId}`,
						)

						// No affiliate code found, nothing to do
						if (!affiliateCode) {
							return { context: ctx }
						}

						// Find the affiliate link
						const link = await adapter.findOne<AffiliateLink>({
							model: "affiliateLink",
							where: [
								{ field: "code", value: affiliateCode },
								{ field: "isActive", value: true },
							],
						})

						if (!link) {
							console.log(`[Affiliate] Link not found or inactive: ${affiliateCode}`)
							return { context: ctx }
						}

						// Prevent self-referrals (user can't refer themselves)
						if (link.userId === newUserId) {
							console.log(
								`[Affiliate] Self-referral prevented: User ${newUserId} tried to use their own link`,
							)
							return { context: ctx }
						}

						try {
							// Create referral record with try-catch to handle race conditions
							const referralNow = new Date()
							await adapter.create<Referral>({
								model: "referral",
								data: {
									affiliateLinkId: link.id,
									referrerId: link.userId || null,
									referrerOrganizationId: link.organizationId || null,
									referredUserId: newUserId,
									stripeCustomerId: null,
									status: "pending",
									commissionEarned: "0",
									commissionPaid: false,
									signedUpAt: referralNow,
									convertedAt: null,
									expiresAt: null,
									createdAt: referralNow,
									updatedAt: referralNow,
								},
							})

							// Increment signup count
							await adapter.update<AffiliateLink>({
								model: "affiliateLink",
								where: [{ field: "id", value: link.id }],
								update: {
									signupCount: (link.signupCount || 0) + 1,
								},
							})

							console.log(`[Affiliate] Referral created: ${newUserId} via ${affiliateCode}`)

							// Call optional signup callback
							if (onReferralSignup) {
								try {
									await onReferralSignup({
										affiliateLink: link,
										referredUser: {
											id: newUser.id,
											name: newUser.name,
											email: newUser.email,
										},
										affiliateCode,
									})
								} catch (callbackError) {
									console.error("[Affiliate] onReferralSignup callback error:", callbackError)
									// Don't throw - callback failure shouldn't block signup
								}
							}
						} catch (error) {
							// Duplicate key error (unique constraint on referredUserId) - this is expected and fine
							const errorMessage = error instanceof Error ? error.message : String(error)
							if (errorMessage.includes("unique") || errorMessage.includes("duplicate")) {
								console.log(
									`[Affiliate] Referral already exists for user ${newUserId} (duplicate prevented by database)`,
								)
							} else {
								console.error("[Affiliate] Failed to create referral:", error)
							}
						}

						return { context: ctx }
					}),
				},
			],
		},
	} satisfies BetterAuthPlugin
}

export type AffiliatePluginType = ReturnType<typeof affiliatePlugin>

/**
 * Stripe Integration Helpers
 *
 * Use these helpers with the Better Auth Stripe plugin to automatically
 * track conversions and recurring commissions.
 *
 * @example
 * ```typescript
 * import { stripe } from "@better-auth/stripe"
 * import { affiliatePlugin, stripeIntegration } from "better-auth-affiliates"
 *
 * export const auth = betterAuth({
 *   plugins: [
 *     stripe({
 *       stripeSecret: process.env.STRIPE_SECRET_KEY,
 *       stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
 *       createCustomerOnSignUp: true,
 *
 *       // Pass affiliate code to Stripe checkout
 *       async getCheckoutSessionParams({ user, request }) {
 *         return stripeIntegration.getCheckoutSessionParams(request)
 *       },
 *
 *       // Auto-record conversion on subscription complete
 *       async onSubscriptionComplete({ subscription, user, stripeSubscription }) {
 *         await stripeIntegration.handleSubscriptionComplete({
 *           auth,
 *           user,
 *           stripeSubscription,
 *         })
 *       },
 *
 *       // Track recurring payments
 *       async onEvent({ event }) {
 *         await stripeIntegration.handleStripeEvent({ auth, event })
 *       },
 *     }),
 *
 *     affiliatePlugin({
 *       commissionRate: "30.00",
 *       commissionType: "percentage",
 *     }),
 *   ],
 * })
 * ```
 */
export const stripeIntegration = {
	/**
	 * Get checkout session params with affiliate code metadata
	 * Use this in the Stripe plugin's getCheckoutSessionParams callback
	 */
	getCheckoutSessionParams(request?: Request | null): {
		metadata?: { affiliateCode?: string }
	} {
		const affiliateCode = parseAffiliateCode(request)
		if (!affiliateCode) return {}

		return {
			metadata: {
				affiliateCode,
			},
		}
	},

	/**
	 * Handle subscription complete event from Stripe plugin
	 * Records the initial conversion and commission
	 */
	async handleSubscriptionComplete<T extends { api: { recordConversion: Function } }>({
		auth,
		user,
		stripeSubscription,
	}: {
		auth: T
		user: { id: string }
		stripeSubscription: {
			id: string
			customer: string
			metadata?: { affiliateCode?: string } | null
			items: {
				data: Array<{
					price: {
						unit_amount: number | null
					}
				}>
			}
		}
	}): Promise<{ success: boolean; commissionAmount?: string }> {
		// Get affiliate code from subscription metadata
		const affiliateCode = stripeSubscription.metadata?.affiliateCode
		if (!affiliateCode) {
			return { success: false }
		}

		// Calculate payment amount from subscription
		const paymentAmount =
			stripeSubscription.items.data[0]?.price?.unit_amount != null
				? (stripeSubscription.items.data[0].price.unit_amount / 100).toString()
				: "0"

		// Record conversion via the plugin endpoint
		try {
			const result = await auth.api.recordConversion({
				body: {
					referredUserId: user.id,
					paymentAmount,
					stripeCustomerId: String(stripeSubscription.customer),
				},
			})
			return result
		} catch (error) {
			console.error("[Affiliate] Failed to record conversion:", error)
			return { success: false }
		}
	},

	/**
	 * Handle Stripe webhook events for recurring commissions
	 * Use this in the Stripe plugin's onEvent callback
	 */
	async handleStripeEvent<T extends { api: { recordRecurringCommission: Function } }>({
		auth,
		event,
	}: {
		auth: T
		event: {
			type: string
			data: {
				object: {
					id?: string
					customer?: string
					amount_paid?: number
					payment_intent?: string
					subscription?: string
					metadata?: { affiliateCode?: string } | null
				}
			}
		}
	}): Promise<{ success: boolean; commissionAmount?: string }> {
		// Only handle invoice.paid events for recurring payments
		if (event.type !== "invoice.paid") {
			return { success: false }
		}

		const invoice = event.data.object
		const stripeCustomerId = invoice.customer
		const amountPaid = invoice.amount_paid

		if (!stripeCustomerId || !amountPaid) {
			return { success: false }
		}

		// Convert cents to dollars
		const paymentAmount = (amountPaid / 100).toString()

		try {
			const result = await auth.api.recordRecurringCommission({
				body: {
					stripeCustomerId: String(stripeCustomerId),
					paymentAmount,
					stripeInvoiceId: invoice.id,
					stripePaymentIntentId: invoice.payment_intent
						? String(invoice.payment_intent)
						: undefined,
				},
			})
			return result
		} catch (error) {
			console.error("[Affiliate] Failed to record recurring commission:", error)
			return { success: false }
		}
	},
}
