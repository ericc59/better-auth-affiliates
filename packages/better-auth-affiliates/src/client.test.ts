import { type MockInstance, beforeEach, describe, expect, it, vi } from "vitest"
import { affiliateClientPlugin } from "./client"

describe("affiliateClientPlugin", () => {
	describe("plugin configuration", () => {
		it("should create a client plugin with the correct id", () => {
			const plugin = affiliateClientPlugin()
			expect(plugin.id).toBe("affiliate")
		})

		it("should have getActions function", () => {
			const plugin = affiliateClientPlugin()
			expect(typeof plugin.getActions).toBe("function")
		})
	})

	describe("getActions", () => {
		const mockFetch = vi.fn()

		beforeEach(() => {
			mockFetch.mockClear()
		})

		it("should return all required actions", () => {
			const plugin = affiliateClientPlugin()
			const actions = plugin.getActions(mockFetch)

			expect(actions).toHaveProperty("createLink")
			expect(actions).toHaveProperty("getLinks")
			expect(actions).toHaveProperty("trackClick")
			expect(actions).toHaveProperty("getStats")
			expect(actions).toHaveProperty("deactivateLink")
			expect(actions).toHaveProperty("recordConversion")
			expect(actions).toHaveProperty("markCommissionsPaid")
			expect(actions).toHaveProperty("getCommissions")
			expect(actions).toHaveProperty("recordRecurringCommission")
		})

		describe("createLink", () => {
			it("should call fetch with correct endpoint and method", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.createLink({ code: "TEST123", name: "Test Link" })

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/create-link", {
					method: "POST",
					body: { code: "TEST123", name: "Test Link" },
				})
			})

			it("should include organizationId when provided", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.createLink({
					code: "TEST123",
					name: "Test Link",
					organizationId: "org-123",
				})

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/create-link", {
					method: "POST",
					body: { code: "TEST123", name: "Test Link", organizationId: "org-123" },
				})
			})
		})

		describe("getLinks", () => {
			it("should call fetch with correct endpoint", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.getLinks()

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/links?", {
					method: "GET",
				})
			})

			it("should include organizationId in query params when provided", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.getLinks({ organizationId: "org-123" })

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/links?organizationId=org-123", {
					method: "GET",
				})
			})
		})

		describe("trackClick", () => {
			it("should call fetch with correct endpoint and body", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.trackClick({ code: "PROMO2024" })

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/track-click", {
					method: "POST",
					body: { code: "PROMO2024" },
				})
			})
		})

		describe("getStats", () => {
			it("should call fetch with no params when none provided", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.getStats()

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/stats?", {
					method: "GET",
				})
			})

			it("should include organizationId in query params", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.getStats({ organizationId: "org-456" })

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/stats?organizationId=org-456", {
					method: "GET",
				})
			})

			it("should include linkId in query params", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.getStats({ linkId: "link-789" })

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/stats?linkId=link-789", {
					method: "GET",
				})
			})

			it("should include both organizationId and linkId when provided", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.getStats({ organizationId: "org-456", linkId: "link-789" })

				expect(mockFetch).toHaveBeenCalledWith(
					"/affiliate/stats?organizationId=org-456&linkId=link-789",
					{
						method: "GET",
					},
				)
			})
		})

		describe("deactivateLink", () => {
			it("should call fetch with correct endpoint and body", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.deactivateLink({ linkId: "link-123" })

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/deactivate-link", {
					method: "POST",
					body: { linkId: "link-123" },
				})
			})
		})

		describe("recordConversion", () => {
			it("should call fetch with correct endpoint and body", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.recordConversion({
					referredUserId: "user-123",
					paymentAmount: "99.99",
				})

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/record-conversion", {
					method: "POST",
					body: { referredUserId: "user-123", paymentAmount: "99.99" },
				})
			})
		})

		describe("markCommissionsPaid", () => {
			it("should call fetch with correct endpoint and body with referralIds", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.markCommissionsPaid({
					referralIds: ["ref-1", "ref-2", "ref-3"],
				})

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/mark-paid", {
					method: "POST",
					body: { referralIds: ["ref-1", "ref-2", "ref-3"] },
				})
			})

			it("should call fetch with commissionIds", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.markCommissionsPaid({
					commissionIds: ["comm-1", "comm-2"],
				})

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/mark-paid", {
					method: "POST",
					body: { commissionIds: ["comm-1", "comm-2"] },
				})
			})

			it("should handle empty referralIds array", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.markCommissionsPaid({ referralIds: [] })

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/mark-paid", {
					method: "POST",
					body: { referralIds: [] },
				})
			})
		})

		describe("getCommissions", () => {
			it("should call fetch with no params when none provided", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.getCommissions()

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/commissions?", {
					method: "GET",
				})
			})

			it("should include organizationId in query params", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.getCommissions({ organizationId: "org-123" })

				expect(mockFetch).toHaveBeenCalledWith(
					"/affiliate/commissions?organizationId=org-123",
					{ method: "GET" },
				)
			})

			it("should include status in query params", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.getCommissions({ status: "approved" })

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/commissions?status=approved", {
					method: "GET",
				})
			})

			it("should include pagination params", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.getCommissions({ limit: 10, offset: 20 })

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/commissions?limit=10&offset=20", {
					method: "GET",
				})
			})

			it("should include all params when provided", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.getCommissions({
					organizationId: "org-123",
					linkId: "link-456",
					status: "paid",
					limit: 25,
					offset: 50,
				})

				expect(mockFetch).toHaveBeenCalledWith(
					"/affiliate/commissions?organizationId=org-123&linkId=link-456&status=paid&limit=25&offset=50",
					{ method: "GET" },
				)
			})
		})

		describe("recordRecurringCommission", () => {
			it("should call fetch with stripeCustomerId", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.recordRecurringCommission({
					stripeCustomerId: "cus_123",
					paymentAmount: "49.99",
				})

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/record-recurring", {
					method: "POST",
					body: { stripeCustomerId: "cus_123", paymentAmount: "49.99" },
				})
			})

			it("should call fetch with referredUserId", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.recordRecurringCommission({
					referredUserId: "user-123",
					paymentAmount: "99.00",
				})

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/record-recurring", {
					method: "POST",
					body: { referredUserId: "user-123", paymentAmount: "99.00" },
				})
			})

			it("should include Stripe invoice and payment intent IDs", async () => {
				const plugin = affiliateClientPlugin()
				const actions = plugin.getActions(mockFetch)

				await actions.recordRecurringCommission({
					stripeCustomerId: "cus_123",
					paymentAmount: "49.99",
					stripeInvoiceId: "in_123",
					stripePaymentIntentId: "pi_123",
				})

				expect(mockFetch).toHaveBeenCalledWith("/affiliate/record-recurring", {
					method: "POST",
					body: {
						stripeCustomerId: "cus_123",
						paymentAmount: "49.99",
						stripeInvoiceId: "in_123",
						stripePaymentIntentId: "pi_123",
					},
				})
			})
		})
	})
})
