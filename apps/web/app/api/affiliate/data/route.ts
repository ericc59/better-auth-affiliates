import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { affiliateLinks, referrals } from "@/lib/db/schema"
import { desc, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	// Get the user's affiliate link (or demo link for demo purposes)
	const links = await db
		.select()
		.from(affiliateLinks)
		.where(eq(affiliateLinks.userId, session.user.id))
		.orderBy(desc(affiliateLinks.createdAt))
		.limit(1)

	// If user has no links, try to get the first available link (for demo)
	let link = links[0]
	if (!link) {
		const demoLinks = await db
			.select()
			.from(affiliateLinks)
			.orderBy(desc(affiliateLinks.createdAt))
			.limit(1)
		link = demoLinks[0]
	}

	if (!link) {
		return NextResponse.json(null)
	}

	const linkReferrals = await db
		.select()
		.from(referrals)
		.where(eq(referrals.affiliateLinkId, link.id))
		.orderBy(desc(referrals.createdAt))

	return NextResponse.json({
		link: {
			id: link.id,
			code: link.code,
			name: link.name,
			commissionRate: String(link.commissionRate),
			commissionType: link.commissionType,
			fixedAmount: link.fixedAmount ? String(link.fixedAmount) : null,
			clickCount: link.clickCount,
			signupCount: link.signupCount,
			paidReferralCount: link.paidReferralCount,
			totalEarned: String(link.totalEarned),
			isActive: link.isActive,
			expiresAt: link.expiresAt,
		},
		referrals: linkReferrals.map((r) => ({
			id: r.id,
			email: r.email || "Unknown",
			status: r.status,
			amount: r.amount ? String(r.amount) : undefined,
			createdAt: r.createdAt,
			paidAt: r.paidAt || undefined,
		})),
	})
}
