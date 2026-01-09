import { boolean, decimal, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const affiliateLinks = pgTable("affiliate_links", {
	id: uuid("id").defaultRandom().primaryKey(),
	code: text("code").notNull().unique(),
	name: text("name"),
	userId: text("user_id"),
	organizationId: text("organization_id"),
	commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }).notNull().default("10.00"),
	commissionType: text("commission_type", { enum: ["percentage", "fixed"] })
		.notNull()
		.default("percentage"),
	fixedAmount: decimal("fixed_amount", { precision: 10, scale: 2 }),
	clickCount: integer("click_count").notNull().default(0),
	signupCount: integer("signup_count").notNull().default(0),
	paidReferralCount: integer("paid_referral_count").notNull().default(0),
	totalEarned: decimal("total_earned", { precision: 10, scale: 2 }).notNull().default("0.00"),
	isActive: boolean("is_active").notNull().default(true),
	expiresAt: timestamp("expires_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const referrals = pgTable("referrals", {
	id: uuid("id").defaultRandom().primaryKey(),
	affiliateLinkId: uuid("affiliate_link_id")
		.notNull()
		.references(() => affiliateLinks.id),
	referredUserId: text("referred_user_id"),
	email: text("email"),
	status: text("status", { enum: ["pending", "converted", "paid", "rejected"] })
		.notNull()
		.default("pending"),
	amount: decimal("amount", { precision: 10, scale: 2 }),
	paidAt: timestamp("paid_at"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export type AffiliateLink = typeof affiliateLinks.$inferSelect
export type NewAffiliateLink = typeof affiliateLinks.$inferInsert
export type Referral = typeof referrals.$inferSelect
export type NewReferral = typeof referrals.$inferInsert
