import { createHash, randomBytes } from 'node:crypto'

// The OAuth protocol layer: pure, and unaware of where credentials are stored
// or how the browser is opened. Everything it needs arrives as an argument so
// the interesting logic is testable without a network or a config file.

const AUTHORIZE_ENDPOINT = 'https://app.asana.com/-/oauth_authorize'
const TOKEN_ENDPOINT = 'https://app.asana.com/-/oauth_token'

/** 32 random bytes → 43 base64url characters, the shortest verifier the spec allows. */
const VERIFIER_BYTES = 32

export type PkcePair = { verifier: string; challenge: string }

export function createPkcePair(): PkcePair {
	const verifier = randomBytes(VERIFIER_BYTES).toString('base64url')
	return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') }
}

export type AuthorizeUrlParams = {
	clientId: string
	redirectUri: string
	state: string
	challenge: string
	scopes?: string[]
}

export function buildAuthorizeUrl({ clientId, redirectUri, state, challenge, scopes }: AuthorizeUrlParams): string {
	const url = new URL(AUTHORIZE_ENDPOINT)
	url.searchParams.set('response_type', 'code')
	url.searchParams.set('client_id', clientId)
	url.searchParams.set('redirect_uri', redirectUri)
	url.searchParams.set('state', state)
	url.searchParams.set('code_challenge', challenge)
	url.searchParams.set('code_challenge_method', 'S256')
	if (scopes?.length) url.searchParams.set('scope', scopes.join(' '))
	return url.toString()
}

/** Injected so the exchange is testable without a network or a real clock. */
export type OAuthDeps = {
	fetch: typeof globalThis.fetch
	now: () => number
}

export type Tokens = {
	accessToken: string
	refreshToken?: string
	/** Epoch milliseconds — an absolute deadline survives being written to disk. */
	expiresAt: number
}

type TokenResponse = {
	access_token?: string
	refresh_token?: string
	expires_in?: number
	error?: string
	error_description?: string
}

async function requestTokens(form: URLSearchParams, deps: OAuthDeps): Promise<TokenResponse> {
	const res = await deps.fetch(TOKEN_ENDPOINT, {
		method: 'POST',
		headers: { 'content-type': 'application/x-www-form-urlencoded' },
		body: form.toString(),
	})
	const payload = (await res.json().catch(() => ({}))) as TokenResponse
	if (!res.ok || !payload.access_token) {
		const reason = payload.error_description ?? payload.error ?? `HTTP ${res.status}`
		throw new Error(`Asana rejected the token request: ${reason}`)
	}
	return payload
}

function expiryFrom(payload: TokenResponse, deps: OAuthDeps): number {
	return deps.now() + (payload.expires_in ?? 0) * 1000
}

export type ExchangeCodeParams = {
	clientId: string
	clientSecret?: string
	redirectUri: string
	code: string
	verifier: string
}

export async function exchangeCode(
	{ clientId, clientSecret, redirectUri, code, verifier }: ExchangeCodeParams,
	deps: OAuthDeps,
): Promise<Tokens> {
	const form = new URLSearchParams({
		grant_type: 'authorization_code',
		client_id: clientId,
		redirect_uri: redirectUri,
		code,
		code_verifier: verifier,
	})
	if (clientSecret) form.set('client_secret', clientSecret)

	const payload = await requestTokens(form, deps)
	return {
		accessToken: payload.access_token as string,
		refreshToken: payload.refresh_token,
		expiresAt: expiryFrom(payload, deps),
	}
}

export type RefreshParams = {
	clientId: string
	clientSecret?: string
	refreshToken: string
}

export async function refreshAccessToken(
	{ clientId, clientSecret, refreshToken }: RefreshParams,
	deps: OAuthDeps,
): Promise<Tokens> {
	const form = new URLSearchParams({
		grant_type: 'refresh_token',
		client_id: clientId,
		refresh_token: refreshToken,
	})
	if (clientSecret) form.set('client_secret', clientSecret)

	const payload = await requestTokens(form, deps)
	return {
		accessToken: payload.access_token as string,
		// Asana may rotate the refresh token; when it does not, the old one stays valid.
		refreshToken: payload.refresh_token ?? refreshToken,
		expiresAt: expiryFrom(payload, deps),
	}
}
