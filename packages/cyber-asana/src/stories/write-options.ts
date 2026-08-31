export type StoryCreateFields = {
	text?: string
	html_text?: string
	is_pinned?: boolean
}

/** An edit replaces the comment body, so it carries the same fields a create does. */
export type StoryUpdateFields = StoryCreateFields

type BuildStoryCreateInput = {
	text?: string
	htmlText?: string
	isPinned?: boolean
}

function validateHtmlText(htmlText: string) {
	const trimmed = htmlText.trim()
	if (!/^<body(?:\s[^>]*)?>[\s\S]*<\/body>$/.test(trimmed)) {
		throw new Error('html_text must be wrapped in a single <body>...</body> root element')
	}

	const stack: string[] = []
	const tagRe = /<\/?([A-Za-z][\w:-]*)(?:\s[^<>]*)?\/?>/g

	for (const match of trimmed.matchAll(tagRe)) {
		const [full, tagName] = match
		const normalizedTag = tagName
		if (full.startsWith('</')) {
			const current = stack.pop()
			if (current !== normalizedTag) {
				throw new Error('html_text has unbalanced closing tags')
			}
			continue
		}
		if (!full.endsWith('/>')) {
			stack.push(normalizedTag)
		}
	}

	if (stack.length > 0) {
		throw new Error('html_text has unbalanced closing tags')
	}
}

/** The comment body, or undefined when the caller left both text forms out. */
function buildStoryBody(input: BuildStoryCreateInput): StoryCreateFields | undefined {
	if (input.text !== undefined && input.htmlText !== undefined) {
		throw new Error('--text and --html-text are mutually exclusive')
	}
	if (input.htmlText !== undefined) {
		validateHtmlText(input.htmlText)
		return { html_text: input.htmlText }
	}
	if (input.text !== undefined) return { text: input.text }
	return undefined
}

function withPinned(body: StoryCreateFields | undefined, isPinned?: boolean): StoryCreateFields {
	return { ...body, ...(isPinned !== undefined && { is_pinned: isPinned }) }
}

export function buildStoryCreateFields(input: BuildStoryCreateInput): StoryCreateFields {
	const body = buildStoryBody(input)
	// Asana only creates comment stories, and a comment without a body is not one.
	if (!body) throw new Error('Provide either text or --html-text')
	return withPinned(body, input.isPinned)
}

export function buildStoryUpdateFields(input: BuildStoryCreateInput): StoryUpdateFields {
	const body = buildStoryBody(input)
	// Pinning is an edit in its own right, so an update needs a body only when
	// nothing else was asked for.
	if (!body && input.isPinned === undefined) {
		throw new Error('Provide text, --html-text, --pin, or --unpin')
	}
	return withPinned(body, input.isPinned)
}
