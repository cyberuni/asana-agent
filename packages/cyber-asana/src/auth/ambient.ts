import { refreshAccessToken, type Tokens } from './oauth.js'
import { type AppSettings, configDir, readSettings, resolveAppCredentials } from './settings.js'
import { readCredentials, writeCredentials } from './token-store.js'

// Makes stored OAuth credentials ambient: every command resolves them before
// dispatch, so `auth login` is something you do once rather than something
// every later command has to know about.
//
// Nothing here throws. A broken or unrefreshable credential must not stop
// `auth logout` or `auth login` from running — those are exactly the commands
// you reach for when the credential is the problem.

/** Refresh this far ahead of expiry so a command never runs with a token that dies mid-flight. */
const REFRESH_WINDOW_MS = 60_000

export type AmbientDeps = {
	configDir: () => string
	readSettings: (dir: string) => Promise<AppSettings>
	readCredentials: (dir: string) => Promise<Tokens | undefined>
	writeCredentials: (dir: string, tokens: Tokens) => Promise<void>
	refreshAccessToken: typeof refreshAccessToken
	now: () => number
}

export type AmbientCredential = {
	tokens?: Tokens
	/** Why the credential could not be read or refreshed, for a stderr warning. */
	refreshError?: string
}

export function defaultAmbientDeps(): AmbientDeps {
	return {
		configDir: () => configDir(),
		readSettings,
		readCredentials,
		writeCredentials,
		refreshAccessToken,
		now: () => Date.now(),
	}
}

function messageOf(error: unknown): string {
	return error instanceof Error ? error.message : String(error)
}

export async function ensureStoredCredential(deps: AmbientDeps): Promise<AmbientCredential> {
	const dir = deps.configDir()

	let stored: Tokens | undefined
	try {
		stored = await deps.readCredentials(dir)
	} catch (error) {
		return { refreshError: messageOf(error) }
	}
	if (!stored) return {}
	if (stored.expiresAt - deps.now() >= REFRESH_WINDOW_MS) return { tokens: stored }

	if (!stored.refreshToken) {
		return { tokens: stored, refreshError: 'The stored access token has expired and there is no refresh token.' }
	}
	const app = resolveAppCredentials({ settings: await deps.readSettings(dir).catch(() => ({})) })
	if (!app) {
		return {
			tokens: stored,
			refreshError: 'Cannot refresh the stored token without an app registration (ASANA_API_CLIENT_ID).',
		}
	}

	try {
		const refreshed = await deps.refreshAccessToken(
			{ clientId: app.clientId, clientSecret: app.clientSecret, refreshToken: stored.refreshToken },
			{ fetch: globalThis.fetch, now: deps.now },
		)
		await deps.writeCredentials(dir, refreshed)
		return { tokens: refreshed }
	} catch (error) {
		// Hand back the stale token anyway: it may still have seconds left, and a
		// 401 from the API is a better failure than a CLI that refuses to start.
		return { tokens: stored, refreshError: messageOf(error) }
	}
}
