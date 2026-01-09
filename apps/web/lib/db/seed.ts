import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { affiliateLinks, referrals } from "./schema"

const connectionString = process.env.DATABASE_URL!

async function seed() {
	const client = postgres(connectionString)
	const db = drizzle(client)

	console.log("Seeding database...")

	// Clear existing data
	await db.delete(referrals)
	await db.delete(affiliateLinks)

	// Create demo affiliate links
	const [affiliateLink1] = await db
		.insert(affiliateLinks)
		.values({
			code: "DEMO2024",
			name: "Demo Partner Program",
			commissionRate: "15.00",
			commissionType: "percentage",
			clickCount: 1247,
			signupCount: 89,
			paidReferralCount: 67,
			totalEarned: "2847.50",
			isActive: true,
		})
		.returning()

	const [affiliateLink2] = await db
		.insert(affiliateLinks)
		.values({
			code: "PREMIUM50",
			name: "Premium Affiliate",
			commissionRate: "50.00",
			commissionType: "fixed",
			fixedAmount: "50.00",
			clickCount: 523,
			signupCount: 34,
			paidReferralCount: 28,
			totalEarned: "1400.00",
			isActive: true,
		})
		.returning()

	const [affiliateLink3] = await db
		.insert(affiliateLinks)
		.values({
			code: "EXPIRED01",
			name: "Expired Campaign",
			commissionRate: "10.00",
			commissionType: "percentage",
			clickCount: 156,
			signupCount: 12,
			paidReferralCount: 8,
			totalEarned: "320.00",
			isActive: false,
			expiresAt: new Date("2024-01-01"),
		})
		.returning()

	if (!affiliateLink1 || !affiliateLink2 || !affiliateLink3) {
		throw new Error("Failed to create affiliate links")
	}

	console.log("Created affiliate links:", affiliateLink1.id, affiliateLink2.id, affiliateLink3.id)

	// Create demo referrals for the first affiliate link
	const referralData = [
		{
			affiliateLinkId: affiliateLink1.id,
			email: "john.doe@example.com",
			status: "paid" as const,
			amount: "45.00",
			paidAt: new Date("2024-12-15"),
			createdAt: new Date("2024-12-01"),
		},
		{
			affiliateLinkId: affiliateLink1.id,
			email: "jane.smith@example.com",
			status: "paid" as const,
			amount: "67.50",
			paidAt: new Date("2024-12-18"),
			createdAt: new Date("2024-12-05"),
		},
		{
			affiliateLinkId: affiliateLink1.id,
			email: "alex.wilson@example.com",
			status: "converted" as const,
			amount: "52.50",
			createdAt: new Date("2024-12-20"),
		},
		{
			affiliateLinkId: affiliateLink1.id,
			email: "sarah.johnson@example.com",
			status: "pending" as const,
			createdAt: new Date("2024-12-28"),
		},
		{
			affiliateLinkId: affiliateLink1.id,
			email: "mike.brown@example.com",
			status: "pending" as const,
			createdAt: new Date("2024-12-30"),
		},
		{
			affiliateLinkId: affiliateLink1.id,
			email: "emily.davis@example.com",
			status: "rejected" as const,
			createdAt: new Date("2024-12-10"),
		},
	]

	await db.insert(referrals).values(referralData)

	console.log("Created referrals for demo affiliate")

	await client.end()
	console.log("Seeding complete!")
}

seed().catch(console.error)
