import { describe, expect, it, vi } from 'vitest'
import { performLogin } from './login.js'

function deps(overrides: Partial<Parameters<typeof performLogin>[1]> = {}) {
	const close = vi.fn().mockResolvedValue(undefined)
	const opened: string[] = []
	return {
		close,
		opened,
		value: {
			startCallbackServer: vi.fn().mockResolvedValue({
				port: 7654,
				redirectUri: 'http://localhost:7654/callback',
				waitForCode: Promise.resolve('auth-code'),
				close,
			}),
			openBrowser: vi.fn(async (url: string) => {
				opened.push(url)
			}),
			exchangeCode: vi.fn().mockResolvedValue({
				accessToken: 'access-token',
				refreshToken: 'refresh-token',
				expiresAt: 3_600_000,
				user: { gid: '1201', name: 'Homa Wong' },
			}),
			createPkcePair: () => ({ verifier: 'verifier-789', challenge: 'challenge-xyz' }),
			createState: () => 'state-abc',
			announce: () => {},
			...overrides,
		} as Parameters<typeof performLogin>[1],
	}
}

const app = { clientId: 'client-123', clientSecret: 'secret-456', source: 'settings.json' as const }

describe('performLogin', () => {
	it('opens an authorize URL carrying the client, the challenge, and the state', async () => {
		const d = deps()

		await performLogin({ app, port: 7654 }, d.value)

		const url = new URL(d.opened[0])
		expect(url.searchParams.get('client_id')).toBe('client-123')
		expect(url.searchParams.get('state')).toBe('state-abc')
		expect(url.searchParams.get('code_challenge')).toBe('challenge-xyz')
	})

	it('sends the browser to the redirect URI the callback server is listening on', async () => {
		const d = deps()

		await performLogin({ app, port: 7654 }, d.value)

		expect(new URL(d.opened[0]).searchParams.get('redirect_uri')).toBe('http://localhost:7654/callback')
	})

	it('exchanges the captured code with the verifier that produced the challenge', async () => {
		const d = deps()

		await performLogin({ app, port: 7654 }, d.value)

		expect(d.value.exchangeCode).toHaveBeenCalledWith(
			expect.objectContaining({
				clientId: 'client-123',
				clientSecret: 'secret-456',
				code: 'auth-code',
				verifier: 'verifier-789',
				redirectUri: 'http://localhost:7654/callback',
			}),
			expect.anything(),
		)
	})

	it('returns the tokens from the exchange', async () => {
		const d = deps()

		const tokens = await performLogin({ app, port: 7654 }, d.value)

		expect(tokens.accessToken).toBe('access-token')
		expect(tokens.user?.name).toBe('Homa Wong')
	})

	it('announces the authorize URL so a browser that never opens is recoverable', async () => {
		const announced: string[] = []
		const d = deps({ announce: (message: string) => announced.push(message) })

		await performLogin({ app, port: 7654 }, d.value)

		expect(announced.join('\n')).toContain(d.opened[0])
	})

	it('announces the URL before opening the browser, in case opening hangs', async () => {
		const order: string[] = []
		const d = deps({
			announce: () => order.push('announce'),
			openBrowser: async () => {
				order.push('open')
			},
		})

		await performLogin({ app, port: 7654 }, d.value)

		expect(order).toEqual(['announce', 'open'])
	})

	it('requests the scopes the caller asked for', async () => {
		const d = deps()

		await performLogin({ app, port: 7654, scopes: ['tasks:read'] }, d.value)

		expect(new URL(d.opened[0]).searchParams.get('scope')).toBe('tasks:read')
	})

	describe('manual mode', () => {
		it('uses the out-of-band redirect Asana documents for command line apps', async () => {
			const announced: string[] = []
			const d = deps({ promptForCode: async () => 'pasted-code', announce: (m: string) => announced.push(m) })

			await performLogin({ app, port: 7654, manual: true }, d.value)

			const url = new URL(announced.join('\n').match(/https:\/\/\S+/)?.[0] ?? '')
			expect(url.searchParams.get('redirect_uri')).toBe('urn:ietf:wg:oauth:2.0:oob')
		})

		it('never opens a local port, since nothing will redirect to it', async () => {
			const d = deps({ promptForCode: async () => 'pasted-code' })

			await performLogin({ app, port: 7654, manual: true }, d.value)

			expect(d.value.startCallbackServer).not.toHaveBeenCalled()
		})

		it('exchanges the code the user pasted, against the same redirect', async () => {
			const d = deps({ promptForCode: async () => 'pasted-code' })

			await performLogin({ app, port: 7654, manual: true }, d.value)

			expect(d.value.exchangeCode).toHaveBeenCalledWith(
				expect.objectContaining({ code: 'pasted-code', redirectUri: 'urn:ietf:wg:oauth:2.0:oob' }),
				expect.anything(),
			)
		})

		it('fails clearly when no code is pasted', async () => {
			const d = deps({ promptForCode: async () => '  ' })

			await expect(performLogin({ app, port: 7654, manual: true }, d.value)).rejects.toThrow(/no authorization code/i)
		})
	})

	it('uses the redirect URI the caller specifies instead of the loopback default', async () => {
		const d = deps()

		await performLogin({ app, port: 7654, redirectUri: 'https://example.com/cb' }, d.value)

		expect(new URL(d.opened[0]).searchParams.get('redirect_uri')).toBe('https://example.com/cb')
	})

	it('shuts the callback server down once the flow completes', async () => {
		const d = deps()

		await performLogin({ app, port: 7654 }, d.value)

		expect(d.close).toHaveBeenCalled()
	})

	it('shuts the callback server down even when the exchange fails', async () => {
		const d = deps({ exchangeCode: vi.fn().mockRejectedValue(new Error('invalid_grant')) })

		await expect(performLogin({ app, port: 7654 }, d.value)).rejects.toThrow(/invalid_grant/)

		expect(d.close).toHaveBeenCalled()
	})

	it('shuts the callback server down when the user declines', async () => {
		const close = vi.fn().mockResolvedValue(undefined)
		const d = deps({
			startCallbackServer: vi.fn().mockResolvedValue({
				port: 7654,
				redirectUri: 'http://localhost:7654/callback',
				waitForCode: Promise.reject(new Error('access_denied')),
				close,
			}),
		})

		await expect(performLogin({ app, port: 7654 }, d.value)).rejects.toThrow(/access_denied/)

		expect(close).toHaveBeenCalled()
	})
})
