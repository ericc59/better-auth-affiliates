import { Analytics } from "@vercel/analytics/next"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"

import "@workspace/ui/globals.css"
import "./globals.css"
import { Providers } from "@/components/providers"

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
				<Providers>{children}</Providers>
				<Analytics />
			</body>
		</html>
	)
}
