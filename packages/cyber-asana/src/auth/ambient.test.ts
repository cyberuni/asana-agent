import { describe, expect, it, vi } from 'vitest'
import { ensureStoredCredential } from './ambient.js'

const NOW = 1_000_000

function deps(overrides: Record<string, unknown> = {}) {
	return {
		configDir: () => '/tmp/cyber-asana-test',
		readSettings: vi.fn().mockResolvedValue({ client_id: 'client-123', client_secret: 'secret-456' }),
		readCredentials: vi.fn().mockResolvedValue({
			accessToken: 'stored-token',
			refreshToken: 'refresh-token',
			expiresAt: NOW + 600_000,
		}),
		writeCredentials: vi.fn().mockResolvedValue(undefined),
		refreshAccessToken: vi.fn().mockResolvedValue({
			accessToken: 'refreshed-token',
			refreshToken: 'refresh-token',
			expiresAt: NOW + 3_600_000,
		}),
		now: () => NOW,
		...overrides,
	} as never
}

describe('ensureStoredCredential', () => {
	it('reports nothing when no credentials are stored', async () => {
		const result = await ensureStoredCredential(deps({ readCredentials: vi.fn().mockResolvedValue(undefined) }))

		expect(result.tokens).toBeUndefined()
	})

	it('returns a still-valid token without contacting Asana', async () => {
		const d = deps()

		const result = await ensureStoredCredential(d)

		expect(result.tokens?.accessToken).toBe('stored-token')
		expect((d as never as { refreshAccessToken: ReturnType<typeof vi.fn> }).refreshAccessToken).not.toHaveBeenCalled()
	})

	it('refreshes and persists a token that is about to expire', async () => {
		const d = deps({
			readCredentials: vi
				.fn()
				.mockResolvedValue({ accessToken: 'stale', refreshToken: 'refresh-token', expiresAt: NOW + 5_000 }),
		}) as never as { writeCredentials: ReturnType<typeof vi.fn> }

		const result = await ensureStoredCredential(d as never)

		expect(result.tokens?.accessToken).toBe('refreshed-token')
		expect(d.writeCredentials).toHaveBeenCalled()
	})

	it('keeps working with the stale token when the refresh fails, and says why', async () => {
		const d = deps({
			readCredentials: vi
				.fn()
				.mockResolvedValue({ accessToken: 'stale', refreshToken: 'refresh-token', expiresAt: NOW + 5_000 }),
			refreshAccessToken: vi.fn().mockRejectedValue(new Error('invalid_grant')),
		})

		const result = await ensureStoredCredential(d)

		expect(result.tokens?.accessToken).toBe('stale')
		expect(result.refreshError).toMatch(/invalid_grant/)
	})

	it('reports unreadable credentials instead of throwing at every command', async () => {
		const d = deps({ readCredentials: vi.fn().mockRejectedValue(new Error('Could not parse credentials.json')) })

		const result = await ensureStoredCredential(d)

		expect(result.tokens).toBeUndefined()
		expect(result.refreshError).toMatch(/credentials\.json/)
	})

	it('cannot refresh without an app registration, and says so', async () => {
		const d = deps({
			readSettings: vi.fn().mockResolvedValue({}),
			readCredentials: vi
				.fn()
				.mockResolvedValue({ accessToken: 'stale', refreshToken: 'refresh-token', expiresAt: NOW + 5_000 }),
		})

		const result = await ensureStoredCredential(d)

		expect(result.refreshError).toMatch(/ASANA_CLIENT_ID|registration/i)
	})
})
