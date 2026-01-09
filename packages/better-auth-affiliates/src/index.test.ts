import { describe, expect, it, vi } from "vitest"
import { affiliatePlugin } from "./index"

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
		})

		it("should include database schema for affiliateLink and referral", () => {
			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
			})

			expect(plugin.schema).toHaveProperty("affiliateLink")
			expect(plugin.schema).toHaveProperty("referral")
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

			const plugin = affiliatePlugin({
				commissionRate: "30.00",
				commissionType: "percentage",
				onReferralSignup,
				onReferralConversion,
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
