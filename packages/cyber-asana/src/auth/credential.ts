// Which credential this process will actually use — and which ones it is
// ignoring. The precedence chain is otherwise invisible: a stale env var
// silently shadowing a newer one looks identical to a bad token.

/** Token-bearing environment variables, most preferred first. */
const TOKEN_ENV_VARS = ['ASANA_ACCESS_TOKEN', 'ASANA_TOKEN'] as const

const FLAG_SOURCE = '--token'

export type Credential = {
	authenticated: boolean
	/** Label of the winning source, e.g. `--token` or `ASANA_ACCESS_TOKEN`. */
	source?: string
	token?: string
	/** Labels of sources that hold a token but lost to `source`. */
	shadowed: string[]
}

/** A token rendered for display — enough to recognize, not enough to use. */
export function maskToken(token: string): string {
	return token.length > 4 ? `…${token.slice(-4)}` : '…'
}

export type ResolveCredentialInput = {
	tokenOverride?: string
	env?: Record<string, string | undefined>
}

export function resolveCredential({ tokenOverride, env = process.env }: ResolveCredentialInput): Credential {
	const candidates: Array<{ source: string; token: string }> = []
	if (tokenOverride) candidates.push({ source: FLAG_SOURCE, token: tokenOverride })
	for (const name of TOKEN_ENV_VARS) {
		const token = env[name]
		if (token) candidates.push({ source: name, token })
	}

	const [winner, ...rest] = candidates
	if (!winner) return { authenticated: false, shadowed: [] }
	return {
		authenticated: true,
		source: winner.source,
		token: winner.token,
		shadowed: rest.map((c) => c.source),
	}
}
