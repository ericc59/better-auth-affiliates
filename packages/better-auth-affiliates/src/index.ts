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
	status: "pending" | "active" | "churned" | "expired"
	commissionEarned: string
	commissionPaid: boolean
	signedUpAt: Date
	convertedAt: Date | null
	expiresAt: Date | null
	createdAt: Date
	updatedAt: Date
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
}

/**
 * Better Auth Affiliate Plugin
 *
 * Features:
 * - Create and manage multiple affiliate links per user/organization
 * - Track referral clicks, signups, and conversions
 * - Calculate commissions on subscription payments
 * - Support both user-level and organization-level affiliates
 * - Works with any database adapter supported by Better Auth
 */
export const affiliatePlugin = (options: AffiliatePluginOptions) => {
	const {
		commissionRate,
		commissionType,
		commissionDurationMonths = 12,
		cookieDurationDays = 30,
		onReferralSignup,
		onReferralConversion,
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

					// Get unpaid commission
					const unpaidReferrals = await adapter.findMany<Referral>({
						model: "referral",
						where: organizationId
							? [
									{ field: "referrerOrganizationId", value: organizationId },
									{ field: "commissionPaid", value: false },
									{ field: "status", value: "active" },
								]
							: [
									{ field: "referrerId", value: userId },
									{ field: "commissionPaid", value: false },
									{ field: "status", value: "active" },
								],
					})

					const unpaidCommission = unpaidReferrals.reduce(
						(sum, ref) => sum + (Number(ref.commissionEarned) || 0),
						0,
					)

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
							links: links.map((link) => ({
								id: link.id,
								code: link.code,
								name: link.name,
								clicks: link.clickCount,
								signups: link.signupCount,
								paidReferrals: link.paidReferralCount,
								earned: link.totalEarned,
							})),
							recentReferrals,
						},
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
					}),
				},
				async (ctx) => {
					const adapter = ctx.context.adapter
					const { referredUserId, paymentAmount } = ctx.body

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

					// Calculate commission
					let commissionAmount: string
					if (link.commissionType === "percentage") {
						const rate = Number.parseFloat(link.commissionRate) / 100
						const payment = Number.parseFloat(paymentAmount)
						commissionAmount = (payment * rate).toFixed(2)
					} else {
						commissionAmount = link.fixedAmount || link.commissionRate
					}

					const now = new Date()
					const expiresAt = new Date()
					expiresAt.setMonth(expiresAt.getMonth() + commissionDurationMonths)

					// Update referral status
					await adapter.update<Referral>({
						model: "referral",
						where: [{ field: "id", value: referral.id }],
						update: {
							status: "active",
							convertedAt: now,
							commissionEarned: commissionAmount,
							expiresAt,
						},
					})

					// Update affiliate link stats
					await adapter.update<AffiliateLink>({
						model: "affiliateLink",
						where: [{ field: "id", value: link.id }],
						update: {
							paidReferralCount: (link.paidReferralCount || 0) + 1,
							totalEarned: (
								Number.parseFloat(link.totalEarned || "0") + Number.parseFloat(commissionAmount)
							).toFixed(2),
						},
					})

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
							// Don't throw - callback failure shouldn't block conversion
						}
					}

					return ctx.json({
						success: true,
						commissionAmount,
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
						referralIds: z.array(z.string()),
					}),
				},
				async (ctx) => {
					const adapter = ctx.context.adapter
					const { referralIds } = ctx.body

					// Update each referral
					for (const referralId of referralIds) {
						await adapter.update<Referral>({
							model: "referral",
							where: [{ field: "id", value: referralId }],
							update: {
								commissionPaid: true,
							},
						})
					}

					return ctx.json({
						success: true,
						updatedCount: referralIds.length,
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
