"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
	const { theme, setTheme } = useTheme()
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	if (!mounted) {
		return (
			<button
				type="button"
				className="flex size-9 items-center justify-center rounded-md text-zinc-400"
				aria-label="Toggle theme"
			>
				<Sun className="size-4" />
			</button>
		)
	}

	return (
		<button
			type="button"
			onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
			className="flex size-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
			aria-label="Toggle theme"
		>
			{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
		</button>
	)
}
