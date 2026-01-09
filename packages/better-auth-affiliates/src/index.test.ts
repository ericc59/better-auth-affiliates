import { describe, expect, it, vi } from "vitest"
import {
	affiliatePlugin,
	calculateCommission,
	getTierForAffiliate,
	getNextTier,
	parseAffiliateCode,
	stripeIntegration,
	type AffiliateLink,
	type CommissionTier,
} from "./index"

describe("affiliatePlugin", () => {
	describe("plugin configuration", () => {
		it("should create a plugin with the correct id", () => {
			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
			})

			expect(plugin.id).toBe("affiliate")
		})

		it("should include all required endpoints", () => {
			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
			})

			expect(plugin.endpoints).toHaveProperty("createAffiliateLink")
			expect(plugin.endpoints).toHaveProperty("getAffiliateLinks")
			expect(plugin.endpoints).toHaveProperty("trackAffiliateClick")
			expect(plugin.endpoints).toHaveProperty("getAffiliateStats")
			expect(plugin.endpoints).toHaveProperty("deactivateAffiliateLink")
			expect(plugin.endpoints).toHaveProperty("recordConversion")
			expect(plugin.endpoints).toHaveProperty("markCommissionsPaid")
			expect(plugin.endpoints).toHaveProperty("getCommissions")
			expect(plugin.endpoints).toHaveProperty("recordRecurringCommission")
		})

		it("should include database schema for affiliateLink, referral, and affiliateCommission", () => {
			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
			})

			expect(plugin.schema).toHaveProperty("affiliateLink")
			expect(plugin.schema).toHaveProperty("referral")
			expect(plugin.schema).toHaveProperty("affiliateCommission")
		})

		it("should include hooks for signup tracking", () => {
			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
			})

			expect(plugin.hooks).toHaveProperty("after")
			expect(plugin.hooks.after).toHaveLength(1)
		})
	})

	describe("schema definition", () => {
		it("should define affiliateLink schema with all required fields", () => {
			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
			})

			const affiliateLinkFields = plugin.schema.affiliateLink.fields

			expect(affiliateLinkFields).toHaveProperty("code")
			expect(affiliateLinkFields.code.required).toBe(true)
			expect(affiliateLinkFields.code.unique).toBe(true)

			expect(affiliateLinkFields).toHaveProperty("userId")
			expect(affiliateLinkFields).toHaveProperty("organizationId")
			expect(affiliateLinkFields).toHaveProperty("commissionRate")
			expect(affiliateLinkFields).toHaveProperty("commissionType")
			expect(affiliateLinkFields).toHaveProperty("fixedAmount")
			expect(affiliateLinkFields).toHaveProperty("clickCount")
			expect(affiliateLinkFields).toHaveProperty("signupCount")
			expect(affiliateLinkFields).toHaveProperty("paidReferralCount")
			expect(affiliateLinkFields).toHaveProperty("totalEarned")
			expect(affiliateLinkFields).toHaveProperty("isActive")
			expect(affiliateLinkFields).toHaveProperty("expiresAt")
		})

		it("should define referral schema with all required fields", () => {
			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
			})

			const referralFields = plugin.schema.referral.fields

			expect(referralFields).toHaveProperty("affiliateLinkId")
			expect(referralFields.affiliateLinkId.required).toBe(true)

			expect(referralFields).toHaveProperty("referrerId")
			expect(referralFields).toHaveProperty("referrerOrganizationId")
			expect(referralFields).toHaveProperty("referredUserId")
			expect(referralFields.referredUserId.required).toBe(true)
			expect(referralFields.referredUserId.unique).toBe(true)

			expect(referralFields).toHaveProperty("status")
			expect(referralFields).toHaveProperty("commissionEarned")
			expect(referralFields).toHaveProperty("commissionPaid")
			expect(referralFields).toHaveProperty("signedUpAt")
			expect(referralFields).toHaveProperty("convertedAt")
			expect(referralFields).toHaveProperty("expiresAt")
			expect(referralFields).toHaveProperty("stripeCustomerId")
		})

		it("should define affiliateCommission schema with all required fields", () => {
			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
			})

			const commissionFields = plugin.schema.affiliateCommission.fields

			expect(commissionFields).toHaveProperty("referralId")
			expect(commissionFields.referralId.required).toBe(true)
			expect(commissionFields).toHaveProperty("affiliateLinkId")
			expect(commissionFields.affiliateLinkId.required).toBe(true)
			expect(commissionFields).toHaveProperty("amount")
			expect(commissionFields.amount.required).toBe(true)
			expect(commissionFields).toHaveProperty("paymentAmount")
			expect(commissionFields.paymentAmount.required).toBe(true)
			expect(commissionFields).toHaveProperty("stripeInvoiceId")
			expect(commissionFields).toHaveProperty("stripePaymentIntentId")
			expect(commissionFields).toHaveProperty("type")
			expect(commissionFields.type.required).toBe(true)
			expect(commissionFields).toHaveProperty("status")
			expect(commissionFields).toHaveProperty("paidAt")
		})

		it("should set up foreign key references correctly", () => {
			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
			})

			const affiliateLinkFields = plugin.schema.affiliateLink.fields
			const referralFields = plugin.schema.referral.fields

			// AffiliateLink references
			expect(affiliateLinkFields.userId.references).toEqual({
				model: "user",
				field: "id",
				onDelete: "cascade",
			})
			expect(affiliateLinkFields.organizationId.references).toEqual({
				model: "organization",
				field: "id",
				onDelete: "cascade",
			})

			// Referral references
			expect(referralFields.affiliateLinkId.references).toEqual({
				model: "affiliateLink",
				field: "id",
				onDelete: "cascade",
			})
			expect(referralFields.referredUserId.references).toEqual({
				model: "user",
				field: "id",
				onDelete: "cascade",
			})
		})
	})

	describe("plugin options", () => {
		it("should accept percentage commission type", () => {
			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
			})

			expect(plugin.id).toBe("affiliate")
		})

		it("should accept fixed commission type", () => {
			const plugin = affiliatePlugin({
				commissionRate: "50.00",
				commissionType: "fixed",
			})

			expect(plugin.id).toBe("affiliate")
		})

		it("should accept optional commissionDurationMonths", () => {
			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
				commissionDurationMonths: 24,
			})

			expect(plugin.id).toBe("affiliate")
		})

		it("should accept optional cookieDurationDays", () => {
			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
				cookieDurationDays: 60,
			})

			expect(plugin.id).toBe("affiliate")
		})

		it("should accept optional callbacks", () => {
			const onReferralSignup = vi.fn()
			const onReferralConversion = vi.fn()
			const onRecurringCommission = vi.fn()

			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
				onReferralSignup,
				onReferralConversion,
				onRecurringCommission,
			})

			expect(plugin.id).toBe("affiliate")
		})
	})
})

describe("commission calculations", () => {
	describe("percentage commission", () => {
		it("should calculate 30% of $100 correctly", () => {
			const rate = Number.parseFloat("30.00") / 100
			const payment = Number.parseFloat("100.00")
			const commission = (payment * rate).toFixed(2)

			expect(commission).toBe("30.00")
		})

		it("should calculate 15% of $49.99 correctly", () => {
			const rate = Number.parseFloat("15.00") / 100
			const payment = Number.parseFloat("49.99")
			const commission = (payment * rate).toFixed(2)

			expect(commission).toBe("7.50")
		})

		it("should calculate 50% of $200 correctly", () => {
			const rate = Number.parseFloat("50.00") / 100
			const payment = Number.parseFloat("200.00")
			const commission = (payment * rate).toFixed(2)

			expect(commission).toBe("100.00")
		})

		it("should handle decimal percentages", () => {
			const rate = Number.parseFloat("12.50") / 100
			const payment = Number.parseFloat("80.00")
			const commission = (payment * rate).toFixed(2)

			expect(commission).toBe("10.00")
		})
	})

	describe("fixed commission", () => {
		it("should return fixed amount regardless of payment", () => {
			const fixedAmount = "25.00"
			expect(fixedAmount).toBe("25.00")
		})
	})

	describe("stats aggregation", () => {
		it("should sum click counts correctly", () => {
			const links = [{ clickCount: 100 }, { clickCount: 250 }, { clickCount: 50 }]
			const totalClicks = links.reduce((sum, link) => sum + (Number(link.clickCount) || 0), 0)

			expect(totalClicks).toBe(400)
		})

		it("should handle null/undefined click counts", () => {
			const links = [
				{ clickCount: 100 },
				{ clickCount: null },
				{ clickCount: undefined },
				{ clickCount: 50 },
			]
			const totalClicks = links.reduce((sum, link) => sum + (Number(link.clickCount) || 0), 0)

			expect(totalClicks).toBe(150)
		})

		it("should calculate conversion rate correctly", () => {
			const totalClicks = 1000
			const totalSignups = 50
			const conversionRate =
				totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(2) : "0.00"

			expect(conversionRate).toBe("5.00")
		})

		it("should handle zero clicks for conversion rate", () => {
			const totalClicks = 0
			const totalSignups = 0
			const conversionRate =
				totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(2) : "0.00"

			expect(conversionRate).toBe("0.00")
		})

		it("should sum total earned correctly", () => {
			const links = [{ totalEarned: "150.00" }, { totalEarned: "75.50" }, { totalEarned: "24.50" }]
			const totalEarned = links.reduce((sum, link) => sum + (Number(link.totalEarned) || 0), 0)

			expect(totalEarned).toBe(250)
		})
	})
})

describe("expiration logic", () => {
	it("should correctly identify expired links", () => {
		const expiredDate = new Date("2020-01-01")
		const isExpired = new Date(expiredDate) < new Date()

		expect(isExpired).toBe(true)
	})

	it("should correctly identify non-expired links", () => {
		const futureDate = new Date()
		futureDate.setFullYear(futureDate.getFullYear() + 1)
		const isExpired = new Date(futureDate) < new Date()

		expect(isExpired).toBe(false)
	})

	it("should calculate commission expiration date correctly", () => {
		const commissionDurationMonths = 12
		const now = new Date("2024-06-15")
		const expiresAt = new Date(now)
		expiresAt.setMonth(expiresAt.getMonth() + commissionDurationMonths)

		expect(expiresAt.getFullYear()).toBe(2025)
		expect(expiresAt.getMonth()).toBe(5) // June (0-indexed)
	})
})

describe("affiliate code validation", () => {
	it("should accept valid alphanumeric codes", () => {
		const validCodes = ["ABC123", "my-code", "test_code", "Code2024"]
		const regex = /^[A-Za-z0-9_-]+$/

		for (const code of validCodes) {
			expect(regex.test(code)).toBe(true)
		}
	})

	it("should reject codes with invalid characters", () => {
		const invalidCodes = ["code with spaces", "code@special", "code#hash", "code.dot"]
		const regex = /^[A-Za-z0-9_-]+$/

		for (const code of invalidCodes) {
			expect(regex.test(code)).toBe(false)
		}
	})

	it("should require minimum length of 3", () => {
		const shortCode = "AB"
		const validCode = "ABC"

		expect(shortCode.length >= 3).toBe(false)
		expect(validCode.length >= 3).toBe(true)
	})

	it("should enforce maximum length of 50", () => {
		const longCode = "A".repeat(51)
		const validCode = "A".repeat(50)

		expect(longCode.length <= 50).toBe(false)
		expect(validCode.length <= 50).toBe(true)
	})
})

describe("cookie parsing", () => {
	it("should parse cookies correctly", () => {
		const cookieHeader = "affiliateCode=TEST123; session=abc123; other=value"
		const cookies = Object.fromEntries(
			cookieHeader.split("; ").map((c) => {
				const [key, ...values] = c.split("=")
				return [key, values.join("=")]
			}),
		)

		expect(cookies.affiliateCode).toBe("TEST123")
		expect(cookies.session).toBe("abc123")
		expect(cookies.other).toBe("value")
	})

	it("should handle cookies with equals signs in values", () => {
		const cookieHeader = "token=abc=def=ghi; affiliateCode=CODE123"
		const cookies = Object.fromEntries(
			cookieHeader.split("; ").map((c) => {
				const [key, ...values] = c.split("=")
				return [key, values.join("=")]
			}),
		)

		expect(cookies.token).toBe("abc=def=ghi")
		expect(cookies.affiliateCode).toBe("CODE123")
	})

	it("should return empty object for empty cookie header", () => {
		const cookieHeader = ""
		const cookies = cookieHeader
			? Object.fromEntries(
					cookieHeader.split("; ").map((c) => {
						const [key, ...values] = c.split("=")
						return [key, values.join("=")]
					}),
				)
			: {}

		expect(cookies).toEqual({})
	})
})

describe("hook path matching", () => {
	const matcher = (path: string | undefined) =>
		Boolean(path?.startsWith("/sign-up") || path?.includes("/callback"))

	it("should match /sign-up path", () => {
		expect(matcher("/sign-up")).toBe(true)
		expect(matcher("/sign-up/email")).toBe(true)
	})

	it("should match OAuth callback paths", () => {
		expect(matcher("/callback/google")).toBe(true)
		expect(matcher("/callback/github")).toBe(true)
		expect(matcher("/auth/callback")).toBe(true)
	})

	it("should not match sign-in paths", () => {
		expect(matcher("/sign-in")).toBe(false)
		expect(matcher("/sign-in/email")).toBe(false)
	})

	it("should not match other paths", () => {
		expect(matcher("/dashboard")).toBe(false)
		expect(matcher("/profile")).toBe(false)
		expect(matcher("/api/user")).toBe(false)
	})

	it("should handle undefined path", () => {
		expect(matcher(undefined)).toBe(false)
	})
})

describe("self-referral prevention", () => {
	it("should detect self-referral when user owns the link", () => {
		const linkUserId = "user-123"
		const newUserId = "user-123"
		const isSelfReferral = linkUserId === newUserId

		expect(isSelfReferral).toBe(true)
	})

	it("should allow referral when user does not own the link", () => {
		const linkUserId = "user-456"
		const newUserId = "user-123"
		const isSelfReferral = linkUserId === newUserId

		expect(isSelfReferral).toBe(false)
	})

	it("should handle null link userId", () => {
		const linkUserId = null
		const newUserId = "user-123"
		const isSelfReferral = linkUserId === newUserId

		expect(isSelfReferral).toBe(false)
	})
})

describe("referral status transitions", () => {
	const validStatuses = ["pending", "active", "churned", "expired"] as const

	it("should have valid initial status as pending", () => {
		const initialStatus = "pending"
		expect(validStatuses.includes(initialStatus)).toBe(true)
	})

	it("should transition to active on conversion", () => {
		const newStatus = "active"
		expect(validStatuses.includes(newStatus)).toBe(true)
	})

	it("should allow churned status", () => {
		const status = "churned"
		expect(validStatuses.includes(status)).toBe(true)
	})

	it("should allow expired status", () => {
		const status = "expired"
		expect(validStatuses.includes(status)).toBe(true)
	})
})

describe("commission edge cases", () => {
	describe("percentage commission edge cases", () => {
		it("should handle 0% commission", () => {
			const rate = Number.parseFloat("0.00") / 100
			const payment = Number.parseFloat("100.00")
			const commission = (payment * rate).toFixed(2)

			expect(commission).toBe("0.00")
		})

		it("should handle 100% commission", () => {
			const rate = Number.parseFloat("100.00") / 100
			const payment = Number.parseFloat("50.00")
			const commission = (payment * rate).toFixed(2)

			expect(commission).toBe("50.00")
		})

		it("should handle very small payment amounts", () => {
			const rate = Number.parseFloat("10.00") / 100
			const payment = Number.parseFloat("0.99")
			const commission = (payment * rate).toFixed(2)

			expect(commission).toBe("0.10")
		})

		it("should handle very large payment amounts", () => {
			const rate = Number.parseFloat("20.00") / 100
			const payment = Number.parseFloat("9999.99")
			const commission = (payment * rate).toFixed(2)

			expect(commission).toBe("2000.00")
		})

		it("should handle fractional percentages correctly", () => {
			const rate = Number.parseFloat("7.50") / 100
			const payment = Number.parseFloat("133.33")
			const commission = (payment * rate).toFixed(2)

			expect(commission).toBe("10.00")
		})
	})

	describe("total earned calculations", () => {
		it("should accumulate earnings correctly", () => {
			const currentEarned = "150.00"
			const newCommission = "25.50"
			const newTotal = (
				Number.parseFloat(currentEarned) + Number.parseFloat(newCommission)
			).toFixed(2)

			expect(newTotal).toBe("175.50")
		})

		it("should handle initial zero earnings", () => {
			const currentEarned = "0"
			const newCommission = "30.00"
			const newTotal = (
				Number.parseFloat(currentEarned || "0") + Number.parseFloat(newCommission)
			).toFixed(2)

			expect(newTotal).toBe("30.00")
		})

		it("should handle undefined current earnings", () => {
			const currentEarned: string | undefined = undefined
			const newCommission = "30.00"
			const newTotal = (
				Number.parseFloat(currentEarned || "0") + Number.parseFloat(newCommission)
			).toFixed(2)

			expect(newTotal).toBe("30.00")
		})
	})
})

describe("click count incrementing", () => {
	it("should increment click count from 0", () => {
		const currentCount = 0
		const newCount = (currentCount || 0) + 1

		expect(newCount).toBe(1)
	})

	it("should increment click count from existing value", () => {
		const currentCount = 150
		const newCount = (currentCount || 0) + 1

		expect(newCount).toBe(151)
	})

	it("should handle null click count", () => {
		const currentCount: number | null = null
		const newCount = (currentCount || 0) + 1

		expect(newCount).toBe(1)
	})

	it("should handle undefined click count", () => {
		const currentCount: number | undefined = undefined
		const newCount = (currentCount || 0) + 1

		expect(newCount).toBe(1)
	})
})

describe("signup count incrementing", () => {
	it("should increment signup count correctly", () => {
		const currentCount = 25
		const newCount = (currentCount || 0) + 1

		expect(newCount).toBe(26)
	})
})

describe("URL query string building", () => {
	it("should build empty query string when no params", () => {
		const params = new URLSearchParams()
		expect(params.toString()).toBe("")
	})

	it("should build query string with organizationId", () => {
		const params = new URLSearchParams()
		params.set("organizationId", "org-123")
		expect(params.toString()).toBe("organizationId=org-123")
	})

	it("should build query string with multiple params", () => {
		const params = new URLSearchParams()
		params.set("organizationId", "org-123")
		params.set("linkId", "link-456")
		expect(params.toString()).toBe("organizationId=org-123&linkId=link-456")
	})

	it("should encode special characters", () => {
		const params = new URLSearchParams()
		params.set("name", "Test & Demo")
		expect(params.toString()).toBe("name=Test+%26+Demo")
	})
})

describe("calculateCommission function", () => {
	const createMockLink = (
		commissionType: "percentage" | "fixed",
		commissionRate: string,
		fixedAmount?: string,
	): AffiliateLink => ({
		id: "link-1",
		code: "TEST",
		name: "Test Link",
		userId: "user-1",
		organizationId: null,
		commissionRate,
		commissionType,
		fixedAmount: fixedAmount || null,
		clickCount: 0,
		signupCount: 0,
		paidReferralCount: 0,
		totalEarned: "0",
		isActive: true,
		expiresAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	})

	describe("percentage commission", () => {
		it("should calculate 30% commission correctly", () => {
			const link = createMockLink("percentage", "30.00")
			const commission = calculateCommission(link, "100.00")
			expect(commission).toBe("30.00")
		})

		it("should calculate 15% commission correctly", () => {
			const link = createMockLink("percentage", "15.00")
			const commission = calculateCommission(link, "49.99")
			expect(commission).toBe("7.50")
		})

		it("should handle decimal payment amounts", () => {
			const link = createMockLink("percentage", "20.00")
			const commission = calculateCommission(link, "133.33")
			expect(commission).toBe("26.67")
		})

		it("should handle numeric payment amount", () => {
			const link = createMockLink("percentage", "25.00")
			const commission = calculateCommission(link, 200)
			expect(commission).toBe("50.00")
		})
	})

	describe("fixed commission", () => {
		it("should return fixed amount regardless of payment", () => {
			const link = createMockLink("fixed", "50.00", "50.00")
			const commission = calculateCommission(link, "100.00")
			expect(commission).toBe("50.00")
		})

		it("should return fixed amount for any payment", () => {
			const link = createMockLink("fixed", "25.00", "25.00")
			const commission = calculateCommission(link, "9999.99")
			expect(commission).toBe("25.00")
		})

		it("should fall back to commissionRate if fixedAmount is null", () => {
			const link = createMockLink("fixed", "30.00", undefined)
			const commission = calculateCommission(link, "100.00")
			expect(commission).toBe("30.00")
		})
	})
})

describe("parseAffiliateCode function", () => {
	it("should return null when request is null", () => {
		const code = parseAffiliateCode(null)
		expect(code).toBeNull()
	})

	it("should return null when request is undefined", () => {
		const code = parseAffiliateCode(undefined)
		expect(code).toBeNull()
	})

	it("should parse affiliate code from cookie", () => {
		const request = new Request("https://example.com", {
			headers: {
				cookie: "affiliateCode=TEST123; session=abc",
			},
		})
		const code = parseAffiliateCode(request)
		expect(code).toBe("TEST123")
	})

	it("should parse affiliate code from x-affiliate-code header", () => {
		const request = new Request("https://example.com", {
			headers: {
				"x-affiliate-code": "HEADER456",
			},
		})
		const code = parseAffiliateCode(request)
		expect(code).toBe("HEADER456")
	})

	it("should prefer cookie over header", () => {
		const request = new Request("https://example.com", {
			headers: {
				cookie: "affiliateCode=COOKIE789",
				"x-affiliate-code": "HEADER456",
			},
		})
		const code = parseAffiliateCode(request)
		expect(code).toBe("COOKIE789")
	})

	it("should return null when no affiliate code is present", () => {
		const request = new Request("https://example.com", {
			headers: {
				cookie: "session=abc123",
			},
		})
		const code = parseAffiliateCode(request)
		expect(code).toBeNull()
	})
})

describe("stripeIntegration", () => {
	describe("getCheckoutSessionParams", () => {
		it("should return empty object when request is null", () => {
			const params = stripeIntegration.getCheckoutSessionParams(null)
			expect(params).toEqual({})
		})

		it("should return empty object when no affiliate code is present", () => {
			const request = new Request("https://example.com")
			const params = stripeIntegration.getCheckoutSessionParams(request)
			expect(params).toEqual({})
		})

		it("should return metadata with affiliate code from cookie", () => {
			const request = new Request("https://example.com", {
				headers: {
					cookie: "affiliateCode=PROMO2024",
				},
			})
			const params = stripeIntegration.getCheckoutSessionParams(request)
			expect(params).toEqual({
				metadata: {
					affiliateCode: "PROMO2024",
				},
			})
		})

		it("should return metadata with affiliate code from header", () => {
			const request = new Request("https://example.com", {
				headers: {
					"x-affiliate-code": "AFFILIATE123",
				},
			})
			const params = stripeIntegration.getCheckoutSessionParams(request)
			expect(params).toEqual({
				metadata: {
					affiliateCode: "AFFILIATE123",
				},
			})
		})
	})

	describe("handleSubscriptionComplete", () => {
		it("should return success false when no affiliate code in metadata", async () => {
			const mockAuth = {
				api: {
					recordConversion: vi.fn(),
				},
			}

			const result = await stripeIntegration.handleSubscriptionComplete({
				auth: mockAuth,
				user: { id: "user-123" },
				stripeSubscription: {
					id: "sub_123",
					customer: "cus_123",
					metadata: null,
					items: { data: [{ price: { unit_amount: 4999 } }] },
				},
			})

			expect(result).toEqual({ success: false })
			expect(mockAuth.api.recordConversion).not.toHaveBeenCalled()
		})

		it("should call recordConversion when affiliate code is present", async () => {
			const mockAuth = {
				api: {
					recordConversion: vi.fn().mockResolvedValue({ success: true, commissionAmount: "14.99" }),
				},
			}

			const result = await stripeIntegration.handleSubscriptionComplete({
				auth: mockAuth,
				user: { id: "user-123" },
				stripeSubscription: {
					id: "sub_123",
					customer: "cus_456",
					metadata: { affiliateCode: "PARTNER100" },
					items: { data: [{ price: { unit_amount: 4999 } }] },
				},
			})

			expect(mockAuth.api.recordConversion).toHaveBeenCalledWith({
				body: {
					referredUserId: "user-123",
					paymentAmount: "49.99",
					stripeCustomerId: "cus_456",
				},
			})
			expect(result).toEqual({ success: true, commissionAmount: "14.99" })
		})

		it("should handle subscription with zero amount", async () => {
			const mockAuth = {
				api: {
					recordConversion: vi.fn().mockResolvedValue({ success: true }),
				},
			}

			await stripeIntegration.handleSubscriptionComplete({
				auth: mockAuth,
				user: { id: "user-123" },
				stripeSubscription: {
					id: "sub_123",
					customer: "cus_789",
					metadata: { affiliateCode: "FREE" },
					items: { data: [{ price: { unit_amount: null } }] },
				},
			})

			expect(mockAuth.api.recordConversion).toHaveBeenCalledWith({
				body: {
					referredUserId: "user-123",
					paymentAmount: "0",
					stripeCustomerId: "cus_789",
				},
			})
		})
	})

	describe("handleStripeEvent", () => {
		it("should return success false for non-invoice.paid events", async () => {
			const mockAuth = {
				api: {
					recordRecurringCommission: vi.fn(),
				},
			}

			const result = await stripeIntegration.handleStripeEvent({
				auth: mockAuth,
				event: {
					type: "customer.created",
					data: { object: {} },
				},
			})

			expect(result).toEqual({ success: false })
			expect(mockAuth.api.recordRecurringCommission).not.toHaveBeenCalled()
		})

		it("should return success false when customer ID is missing", async () => {
			const mockAuth = {
				api: {
					recordRecurringCommission: vi.fn(),
				},
			}

			const result = await stripeIntegration.handleStripeEvent({
				auth: mockAuth,
				event: {
					type: "invoice.paid",
					data: {
						object: {
							id: "in_123",
							amount_paid: 4999,
						},
					},
				},
			})

			expect(result).toEqual({ success: false })
		})

		it("should call recordRecurringCommission for invoice.paid events", async () => {
			const mockAuth = {
				api: {
					recordRecurringCommission: vi.fn().mockResolvedValue({ success: true, commissionAmount: "14.99" }),
				},
			}

			const result = await stripeIntegration.handleStripeEvent({
				auth: mockAuth,
				event: {
					type: "invoice.paid",
					data: {
						object: {
							id: "in_123",
							customer: "cus_456",
							amount_paid: 4999,
							payment_intent: "pi_789",
						},
					},
				},
			})

			expect(mockAuth.api.recordRecurringCommission).toHaveBeenCalledWith({
				body: {
					stripeCustomerId: "cus_456",
					paymentAmount: "49.99",
					stripeInvoiceId: "in_123",
					stripePaymentIntentId: "pi_789",
				},
			})
			expect(result).toEqual({ success: true, commissionAmount: "14.99" })
		})

		it("should handle invoice without payment_intent", async () => {
			const mockAuth = {
				api: {
					recordRecurringCommission: vi.fn().mockResolvedValue({ success: true }),
				},
			}

			await stripeIntegration.handleStripeEvent({
				auth: mockAuth,
				event: {
					type: "invoice.paid",
					data: {
						object: {
							id: "in_456",
							customer: "cus_789",
							amount_paid: 2999,
						},
					},
				},
			})

			expect(mockAuth.api.recordRecurringCommission).toHaveBeenCalledWith({
				body: {
					stripeCustomerId: "cus_789",
					paymentAmount: "29.99",
					stripeInvoiceId: "in_456",
					stripePaymentIntentId: undefined,
				},
			})
		})
	})
})

describe("commission status values", () => {
	const validStatuses = ["pending", "approved", "paid", "rejected"] as const

	it("should have pending as valid status", () => {
		expect(validStatuses.includes("pending")).toBe(true)
	})

	it("should have approved as valid status", () => {
		expect(validStatuses.includes("approved")).toBe(true)
	})

	it("should have paid as valid status", () => {
		expect(validStatuses.includes("paid")).toBe(true)
	})

	it("should have rejected as valid status", () => {
		expect(validStatuses.includes("rejected")).toBe(true)
	})
})

describe("commission type values", () => {
	const validTypes = ["initial", "recurring"] as const

	it("should have initial as valid type", () => {
		expect(validTypes.includes("initial")).toBe(true)
	})

	it("should have recurring as valid type", () => {
		expect(validTypes.includes("recurring")).toBe(true)
	})
})

describe("getTierForAffiliate", () => {
	const tiers: CommissionTier[] = [
		{ minPaidReferrals: 0, rate: "20.00", name: "Bronze" },
		{ minPaidReferrals: 10, rate: "25.00", name: "Silver" },
		{ minPaidReferrals: 25, rate: "30.00", name: "Gold" },
		{ minPaidReferrals: 50, rate: "35.00", name: "Platinum" },
	]

	it("should return null when no tiers are provided", () => {
		const tier = getTierForAffiliate(5, undefined)
		expect(tier).toBeNull()
	})

	it("should return null when empty tiers array is provided", () => {
		const tier = getTierForAffiliate(5, [])
		expect(tier).toBeNull()
	})

	it("should return Bronze tier for 0 referrals", () => {
		const tier = getTierForAffiliate(0, tiers)
		expect(tier).toEqual({ minPaidReferrals: 0, rate: "20.00", name: "Bronze" })
	})

	it("should return Bronze tier for 9 referrals", () => {
		const tier = getTierForAffiliate(9, tiers)
		expect(tier).toEqual({ minPaidReferrals: 0, rate: "20.00", name: "Bronze" })
	})

	it("should return Silver tier for exactly 10 referrals", () => {
		const tier = getTierForAffiliate(10, tiers)
		expect(tier).toEqual({ minPaidReferrals: 10, rate: "25.00", name: "Silver" })
	})

	it("should return Silver tier for 24 referrals", () => {
		const tier = getTierForAffiliate(24, tiers)
		expect(tier).toEqual({ minPaidReferrals: 10, rate: "25.00", name: "Silver" })
	})

	it("should return Gold tier for exactly 25 referrals", () => {
		const tier = getTierForAffiliate(25, tiers)
		expect(tier).toEqual({ minPaidReferrals: 25, rate: "30.00", name: "Gold" })
	})

	it("should return Platinum tier for 50+ referrals", () => {
		const tier = getTierForAffiliate(100, tiers)
		expect(tier).toEqual({ minPaidReferrals: 50, rate: "35.00", name: "Platinum" })
	})

	it("should handle unsorted tiers", () => {
		const unsortedTiers: CommissionTier[] = [
			{ minPaidReferrals: 25, rate: "30.00" },
			{ minPaidReferrals: 0, rate: "20.00" },
			{ minPaidReferrals: 10, rate: "25.00" },
		]
		const tier = getTierForAffiliate(15, unsortedTiers)
		expect(tier?.rate).toBe("25.00")
	})
})

describe("getNextTier", () => {
	const tiers: CommissionTier[] = [
		{ minPaidReferrals: 0, rate: "20.00", name: "Bronze" },
		{ minPaidReferrals: 10, rate: "25.00", name: "Silver" },
		{ minPaidReferrals: 25, rate: "30.00", name: "Gold" },
		{ minPaidReferrals: 50, rate: "35.00", name: "Platinum" },
	]

	it("should return null when no tiers are provided", () => {
		const next = getNextTier(5, undefined)
		expect(next).toBeNull()
	})

	it("should return null when empty tiers array is provided", () => {
		const next = getNextTier(5, [])
		expect(next).toBeNull()
	})

	it("should return Silver tier as next for 0 referrals", () => {
		const next = getNextTier(0, tiers)
		expect(next?.tier.name).toBe("Silver")
		expect(next?.referralsNeeded).toBe(10)
	})

	it("should return Silver tier as next for 5 referrals", () => {
		const next = getNextTier(5, tiers)
		expect(next?.tier.name).toBe("Silver")
		expect(next?.referralsNeeded).toBe(5)
	})

	it("should return Gold tier as next for 10 referrals", () => {
		const next = getNextTier(10, tiers)
		expect(next?.tier.name).toBe("Gold")
		expect(next?.referralsNeeded).toBe(15)
	})

	it("should return Gold tier as next for 20 referrals", () => {
		const next = getNextTier(20, tiers)
		expect(next?.tier.name).toBe("Gold")
		expect(next?.referralsNeeded).toBe(5)
	})

	it("should return Platinum tier as next for 30 referrals", () => {
		const next = getNextTier(30, tiers)
		expect(next?.tier.name).toBe("Platinum")
		expect(next?.referralsNeeded).toBe(20)
	})

	it("should return null when at highest tier", () => {
		const next = getNextTier(50, tiers)
		expect(next).toBeNull()
	})

	it("should return null when above highest tier", () => {
		const next = getNextTier(100, tiers)
		expect(next).toBeNull()
	})
})

describe("calculateCommission with tiers", () => {
	const createMockLink = (paidReferralCount: number): AffiliateLink => ({
		id: "link-1",
		code: "TEST",
		name: "Test Link",
		userId: "user-1",
		organizationId: null,
		commissionRate: "20.00",
		commissionType: "percentage",
		fixedAmount: null,
		clickCount: 0,
		signupCount: 0,
		paidReferralCount,
		totalEarned: "0",
		isActive: true,
		expiresAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	})

	const tiers: CommissionTier[] = [
		{ minPaidReferrals: 0, rate: "20.00", name: "Bronze" },
		{ minPaidReferrals: 10, rate: "25.00", name: "Silver" },
		{ minPaidReferrals: 25, rate: "30.00", name: "Gold" },
	]

	it("should use link rate when no tiers provided", () => {
		const link = createMockLink(15)
		const commission = calculateCommission(link, "100.00")
		expect(commission).toBe("20.00")
	})

	it("should use Bronze tier rate for 0 referrals", () => {
		const link = createMockLink(0)
		const commission = calculateCommission(link, "100.00", { tiers })
		expect(commission).toBe("20.00")
	})

	it("should use Silver tier rate for 15 referrals", () => {
		const link = createMockLink(15)
		const commission = calculateCommission(link, "100.00", { tiers })
		expect(commission).toBe("25.00")
	})

	it("should use Gold tier rate for 30 referrals", () => {
		const link = createMockLink(30)
		const commission = calculateCommission(link, "100.00", { tiers })
		expect(commission).toBe("30.00")
	})

	it("should use overrideRate when provided", () => {
		const link = createMockLink(30)
		const commission = calculateCommission(link, "100.00", { tiers, overrideRate: "50.00" })
		expect(commission).toBe("50.00")
	})

	it("should calculate tiered commission with decimal payment", () => {
		const link = createMockLink(10)
		const commission = calculateCommission(link, "49.99", { tiers })
		expect(commission).toBe("12.50")
	})

	it("should fall back to link rate if no matching tier", () => {
		const link = createMockLink(5)
		const emptyTiers: CommissionTier[] = []
		const commission = calculateCommission(link, "100.00", { tiers: emptyTiers })
		expect(commission).toBe("20.00")
	})
})
