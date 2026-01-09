"use client"

import { Check, Copy } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { codeToHtml } from "shiki"

interface CodeBlockProps {
	code: string
	language?: string
	filename?: string
	showLineNumbers?: boolean
}

export function CodeBlock({
	code,
	language = "typescript",
	filename,
	showLineNumbers = false,
}: CodeBlockProps) {
	const { resolvedTheme } = useTheme()
	const [html, setHtml] = useState<string>("")
	const [copied, setCopied] = useState(false)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	useEffect(() => {
		if (!mounted) return

		const highlight = async () => {
			const highlighted = await codeToHtml(code, {
				lang: language,
				theme: resolvedTheme === "dark" ? "github-dark" : "github-light",
			})
			setHtml(highlighted)
		}

		highlight()
	}, [code, language, resolvedTheme, mounted])

	const handleCopy = async () => {
		await navigator.clipboard.writeText(code)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	return (
		<div className="overflow-hidden rounded-lg border border-border bg-card">
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<div className="flex items-center gap-2">
					<div className="size-3 rounded-full bg-muted-foreground/30" />
					<div className="size-3 rounded-full bg-muted-foreground/30" />
					<div className="size-3 rounded-full bg-muted-foreground/30" />
				</div>
				<div className="flex items-center gap-2">
					{filename && <span className="font-mono text-xs text-muted-foreground">{filename}</span>}
					<button
						type="button"
						onClick={handleCopy}
						className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						{copied ? (
							<>
								<Check className="size-4 text-green-500" />
								<span className="text-green-500">Copied</span>
							</>
						) : (
							<>
								<Copy className="size-4" />
								<span>Copy</span>
							</>
						)}
					</button>
				</div>
			</div>
			<div className="overflow-x-auto">
				{html ? (
					<div
						className="p-4 text-sm [&>pre]:!bg-transparent [&_code]:font-mono"
						dangerouslySetInnerHTML={{ __html: html }}
					/>
				) : (
					<pre className="p-4 text-sm">
						<code className="font-mono text-muted-foreground">{code}</code>
					</pre>
				)}
			</div>
		</div>
	)
}
