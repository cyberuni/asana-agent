import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { buildAuthorizeUrl, createPkcePair, exchangeCode, refreshAccessToken, revokeRefreshToken } from './oauth.js'

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

/** Records the single request made, so tests can assert on the wire format. */
function recordingFetch(response: Response) {
	const calls: Array<{ url: string; init: RequestInit }> = []
	const fetchImpl = async (url: string | URL, init?: RequestInit) => {
		calls.push({ url: String(url), init: init ?? {} })
		return response
	}
	return { calls, fetchImpl: fetchImpl as unknown as typeof fetch }
}

function bodyOf(init: RequestInit) {
	return new URLSearchParams(String(init.body))
}

describe('createPkcePair', () => {
	it('derives the challenge as the base64url sha256 of the verifier', () => {
		const { verifier, challenge } = createPkcePair()
		const expected = createHash('sha256').update(verifier).digest('base64url')
		expect(challenge).toBe(expected)
	})

	it('generates a verifier within the length range the spec allows', () => {
		const { verifier } = createPkcePair()
		expect(verifier.length).toBeGreaterThanOrEqual(43)
		expect(verifier.length).toBeLessThanOrEqual(128)
	})

	it('generates a verifier of only unreserved characters', () => {
		const { verifier } = createPkcePair()
		expect(verifier).toMatch(/^[A-Za-z0-9\-._~]+$/)
	})

	it('generates a different verifier every time', () => {
		expect(createPkcePair().verifier).not.toBe(createPkcePair().verifier)
	})
})

describe('buildAuthorizeUrl', () => {
	const params = {
		clientId: 'client-123',
		redirectUri: 'http://localhost:7654/callback',
		state: 'state-abc',
		challenge: 'challenge-xyz',
	}

	it('targets the Asana authorize endpoint', () => {
		const url = new URL(buildAuthorizeUrl(params))
		expect(url.origin + url.pathname).toBe('https://app.asana.com/-/oauth_authorize')
	})

	it('requests an authorization code for the given client and redirect', () => {
		const url = new URL(buildAuthorizeUrl(params))
		expect(url.searchParams.get('response_type')).toBe('code')
		expect(url.searchParams.get('client_id')).toBe('client-123')
		expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:7654/callback')
	})

	it('carries the state and the S256 code challenge', () => {
		const url = new URL(buildAuthorizeUrl(params))
		expect(url.searchParams.get('state')).toBe('state-abc')
		expect(url.searchParams.get('code_challenge')).toBe('challenge-xyz')
		expect(url.searchParams.get('code_challenge_method')).toBe('S256')
	})

	it('omits scope when none is requested', () => {
		const url = new URL(buildAuthorizeUrl(params))
		expect(url.searchParams.has('scope')).toBe(false)
	})

	it('includes scope when requested', () => {
		const url = new URL(buildAuthorizeUrl({ ...params, scopes: ['tasks:read', 'projects:read'] }))
		expect(url.searchParams.get('scope')).toBe('tasks:read projects:read')
	})
})

describe('exchangeCode', () => {
	const params = {
		clientId: 'client-123',
		clientSecret: 'secret-456',
		redirectUri: 'http://localhost:7654/callback',
		code: 'auth-code',
		verifier: 'verifier-789',
	}
	const success = {
		access_token: 'access-token',
		refresh_token: 'refresh-token',
		expires_in: 3600,
		token_type: 'bearer',
	}

	it('posts a form-encoded authorization_code grant to the token endpoint', async () => {
		const { calls, fetchImpl } = recordingFetch(jsonResponse(success))

		await exchangeCode(params, { fetch: fetchImpl, now: () => 1000 })

		expect(calls[0].url).toBe('https://app.asana.com/-/oauth_token')
		expect(calls[0].init.method).toBe('POST')
		expect((calls[0].init.headers as Record<string, string>)['content-type']).toBe('application/x-www-form-urlencoded')
		const body = bodyOf(calls[0].init)
		expect(body.get('grant_type')).toBe('authorization_code')
		expect(body.get('client_id')).toBe('client-123')
		expect(body.get('client_secret')).toBe('secret-456')
		expect(body.get('redirect_uri')).toBe('http://localhost:7654/callback')
		expect(body.get('code')).toBe('auth-code')
		expect(body.get('code_verifier')).toBe('verifier-789')
	})

	it('omits client_secret for a public client', async () => {
		const { calls, fetchImpl } = recordingFetch(jsonResponse(success))

		await exchangeCode({ ...params, clientSecret: undefined }, { fetch: fetchImpl, now: () => 1000 })

		expect(bodyOf(calls[0].init).has('client_secret')).toBe(false)
	})

	it('converts the relative expires_in into an absolute expiry', async () => {
		const { fetchImpl } = recordingFetch(jsonResponse(success))

		const tokens = await exchangeCode(params, { fetch: fetchImpl, now: () => 10_000 })

		expect(tokens.accessToken).toBe('access-token')
		expect(tokens.refreshToken).toBe('refresh-token')
		expect(tokens.expiresAt).toBe(10_000 + 3600 * 1000)
	})

	it('captures the account Asana returns alongside the tokens', async () => {
		const { fetchImpl } = recordingFetch(
			jsonResponse({ ...success, data: { gid: '1201', name: 'Homa Wong', email: 'homa@example.com' } }),
		)

		const tokens = await exchangeCode(params, { fetch: fetchImpl, now: () => 1000 })

		expect(tokens.user).toEqual({ gid: '1201', name: 'Homa Wong', email: 'homa@example.com' })
	})

	it('omits the account when Asana returns no user data', async () => {
		const { fetchImpl } = recordingFetch(jsonResponse(success))

		const tokens = await exchangeCode(params, { fetch: fetchImpl, now: () => 1000 })

		expect(tokens.user).toBeUndefined()
	})

	it('reports the provider error description when the exchange is rejected', async () => {
		const { fetchImpl } = recordingFetch(
			jsonResponse({ error: 'invalid_grant', error_description: 'Authorization code expired' }, 400),
		)

		await expect(exchangeCode(params, { fetch: fetchImpl, now: () => 1000 })).rejects.toThrow(
			/Authorization code expired/,
		)
	})

	it('reports the error code when the provider gives no description', async () => {
		const { fetchImpl } = recordingFetch(jsonResponse({ error: 'invalid_client' }, 401))

		await expect(exchangeCode(params, { fetch: fetchImpl, now: () => 1000 })).rejects.toThrow(/invalid_client/)
	})

	// invalid_client is RFC 6749 §5.2's client-authentication failure, and the
	// likeliest way to hit it here is an MCP app's client id driving a flow only
	// an API app can complete.
	it('points a client-authentication failure at the API-app registration', async () => {
		const { fetchImpl } = recordingFetch(
			jsonResponse({ error: 'invalid_client', error_description: 'Client authentication failed' }, 401),
		)

		await expect(exchangeCode(params, { fetch: fetchImpl, now: () => 1000 })).rejects.toThrow(/ASANA_API_CLIENT_ID/)
	})

	// The hint is a guess about the cause; keeping Asana's own words means a
	// wrong guess costs the user nothing.
	it('keeps the provider message alongside the hint', async () => {
		const { fetchImpl } = recordingFetch(
			jsonResponse({ error: 'invalid_client', error_description: 'Client authentication failed' }, 401),
		)

		await expect(exchangeCode(params, { fetch: fetchImpl, now: () => 1000 })).rejects.toThrow(
			/Client authentication failed/,
		)
	})

	it('leaves rejections that are not client-authentication failures unhinted', async () => {
		const { fetchImpl } = recordingFetch(
			jsonResponse({ error: 'invalid_grant', error_description: 'Authorization code expired' }, 400),
		)

		await expect(exchangeCode(params, { fetch: fetchImpl, now: () => 1000 })).rejects.toThrow(
			expect.objectContaining({ message: expect.not.stringContaining('ASANA_API_CLIENT_ID') }),
		)
	})
})

describe('refreshAccessToken', () => {
	const params = { clientId: 'client-123', clientSecret: 'secret-456', refreshToken: 'refresh-token' }

	it('posts a form-encoded refresh_token grant', async () => {
		const { calls, fetchImpl } = recordingFetch(jsonResponse({ access_token: 'new-access', expires_in: 3600 }))

		await refreshAccessToken(params, { fetch: fetchImpl, now: () => 1000 })

		const body = bodyOf(calls[0].init)
		expect(body.get('grant_type')).toBe('refresh_token')
		expect(body.get('refresh_token')).toBe('refresh-token')
		expect(body.get('client_id')).toBe('client-123')
	})

	it('keeps the current refresh token when the response does not return one', async () => {
		const { fetchImpl } = recordingFetch(jsonResponse({ access_token: 'new-access', expires_in: 3600 }))

		const tokens = await refreshAccessToken(params, { fetch: fetchImpl, now: () => 1000 })

		expect(tokens.accessToken).toBe('new-access')
		expect(tokens.refreshToken).toBe('refresh-token')
	})

	it('adopts a rotated refresh token when the response returns one', async () => {
		const { fetchImpl } = recordingFetch(
			jsonResponse({ access_token: 'new-access', refresh_token: 'rotated', expires_in: 3600 }),
		)

		const tokens = await refreshAccessToken(params, { fetch: fetchImpl, now: () => 1000 })

		expect(tokens.refreshToken).toBe('rotated')
	})

	it('points a client-authentication failure at the API-app registration', async () => {
		const { fetchImpl } = recordingFetch(jsonResponse({ error: 'invalid_client' }, 401))

		await expect(refreshAccessToken(params, { fetch: fetchImpl, now: () => 1000 })).rejects.toThrow(
			/ASANA_API_CLIENT_ID/,
		)
	})
})

describe('revokeRefreshToken', () => {
	const params = { clientId: 'client-123', clientSecret: 'secret-456', refreshToken: 'refresh-token' }

	it('posts the refresh token to the revocation endpoint', async () => {
		const { calls, fetchImpl } = recordingFetch(jsonResponse({}))

		await revokeRefreshToken(params, { fetch: fetchImpl, now: () => 1000 })

		expect(calls[0].url).toBe('https://app.asana.com/-/oauth_revoke')
		const body = bodyOf(calls[0].init)
		expect(body.get('token')).toBe('refresh-token')
		expect(body.get('client_id')).toBe('client-123')
		expect(body.get('client_secret')).toBe('secret-456')
	})

	it('reports why revocation failed so logout can say what it could not undo', async () => {
		const { fetchImpl } = recordingFetch(jsonResponse({ error: 'invalid_client' }, 401))

		await expect(revokeRefreshToken(params, { fetch: fetchImpl, now: () => 1000 })).rejects.toThrow(/invalid_client/)
	})
})
