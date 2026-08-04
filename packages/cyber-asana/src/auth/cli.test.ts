import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { authCommand } from './cli.js'
import { resolveCredential } from './credential.js'

describe('auth/cli', () => {
	const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
	const originalArgv = [...process.argv]

	afterEach(() => {
		vi.clearAllMocks()
		process.argv = [...originalArgv]
	})

	async function runStatus(credential: unknown, argv: string[] = ['node', 'test', '--json']) {
		const program = new Command().addCommand(authCommand({ readCredential: () => credential as never }))
		process.argv = argv
		await program.parseAsync(['node', 'test', 'auth', 'status'], { from: 'node' })
		return logSpy.mock.calls.map((call) => String(call[0])).join('\n')
	}

	it('reports stored OAuth credentials, including the account and expiry', async () => {
		const program = new Command().addCommand(
			authCommand({
				readCredential: (input?: { stored?: unknown }) =>
					resolveCredential({ env: {}, stored: input?.stored as never }),
				readStoredCredential: async () => ({
					accessToken: 'stored-token',
					expiresAt: Date.parse('2026-08-04T12:00:00.000Z'),
					user: { gid: '1201', name: 'Homa Wong', email: 'homa@example.com' },
				}),
			} as never),
		)
		process.argv = ['node', 'test']
		await program.parseAsync(['node', 'test', 'auth', 'status'], { from: 'node' })

		const out = logSpy.mock.calls.map((call) => String(call[0])).join('\n')
		expect(out).toContain('credentials.json')
		expect(out).toContain('Homa Wong')
		expect(out).toContain('2026-08-04')
	})

	it('names the source the credential came from', async () => {
		const out = await runStatus({
			authenticated: true,
			source: 'ASANA_ACCESS_TOKEN',
			token: '1/120:abcdef',
			shadowed: [],
		})
		expect(out).toContain('"authenticated": true')
		expect(out).toContain('"source": "ASANA_ACCESS_TOKEN"')
	})

	it('masks the token instead of printing it', async () => {
		const out = await runStatus({
			authenticated: true,
			source: 'ASANA_ACCESS_TOKEN',
			token: '1/120:abcdef',
			shadowed: [],
		})
		expect(out).not.toContain('1/120:abcdef')
		expect(out).toContain('…cdef')
	})

	it('lists the sources being ignored', async () => {
		const out = await runStatus({
			authenticated: true,
			source: '--token',
			token: 'flag-token',
			shadowed: ['ASANA_ACCESS_TOKEN', 'ASANA_TOKEN'],
		})
		expect(out).toContain('ASANA_ACCESS_TOKEN')
		expect(out).toContain('ASANA_TOKEN')
	})

	it('reports an unauthenticated state as data rather than an error', async () => {
		const out = await runStatus({ authenticated: false, shadowed: [] })
		expect(out).toContain('"authenticated": false')
	})

	it('tells an unauthenticated user how to authenticate in text mode', async () => {
		const out = await runStatus({ authenticated: false, shadowed: [] }, ['node', 'test'])
		expect(out).toContain('ASANA_ACCESS_TOKEN')
	})
})

describe('auth login', () => {
	const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
	const originalArgv = [...process.argv]

	afterEach(() => {
		vi.clearAllMocks()
		process.argv = [...originalArgv]
	})

	const tokens = {
		accessToken: 'access-token',
		refreshToken: 'refresh-token',
		expiresAt: 3_600_000,
		user: { gid: '1201', name: 'Homa Wong', email: 'homa@example.com' },
	}

	function loginDeps(overrides: Record<string, unknown> = {}) {
		return {
			readCredential: () => ({ authenticated: false, shadowed: [] }),
			configDir: () => '/tmp/cyber-asana-test',
			readSettings: vi.fn().mockResolvedValue({ client_id: 'client-123', client_secret: 'secret-456' }),
			login: vi.fn().mockResolvedValue(tokens),
			writeCredentials: vi.fn().mockResolvedValue(undefined),
			...overrides,
		}
	}

	async function runLogin(deps: Record<string, unknown>, args: string[] = [], argv = ['node', 'test']) {
		const program = new Command().addCommand(authCommand(deps as never))
		process.argv = argv
		await program.parseAsync(['node', 'test', 'auth', 'login', ...args], { from: 'node' })
		return logSpy.mock.calls.map((call) => String(call[0])).join('\n')
	}

	it('stores the credentials and names the account that granted them', async () => {
		const deps = loginDeps()

		const out = await runLogin(deps)

		expect(deps.writeCredentials).toHaveBeenCalledWith('/tmp/cyber-asana-test', tokens)
		expect(out).toContain('Homa Wong')
	})

	it('never prints the token when it stored it', async () => {
		const out = await runLogin(loginDeps())

		expect(out).not.toContain('access-token')
	})

	it('prints the access token and stores nothing with --no-store', async () => {
		const deps = loginDeps()

		const out = await runLogin(deps, ['--no-store'])

		expect(deps.writeCredentials).not.toHaveBeenCalled()
		expect(out).toContain('access-token')
	})

	it('withholds the refresh token from --no-store output by default', async () => {
		const out = await runLogin(loginDeps(), ['--no-store'])

		expect(out).not.toContain('refresh-token')
	})

	it('includes the refresh token only when explicitly asked', async () => {
		const out = await runLogin(loginDeps(), ['--no-store', '--include-refresh-token'])

		expect(out).toContain('refresh-token')
	})

	it('does not store when asked for the refresh token, since that is a print-only request', async () => {
		const deps = loginDeps()

		const out = await runLogin(deps, ['--include-refresh-token'])

		expect(deps.writeCredentials).not.toHaveBeenCalled()
		expect(out).toContain('refresh-token')
	})

	it('prints nothing but the token with --raw', async () => {
		const out = await runLogin(loginDeps(), ['--no-store', '--raw'])

		expect(out.trim()).toBe('access-token')
	})

	it('explains how to register an app when no client id is configured', async () => {
		const deps = loginDeps({ readSettings: vi.fn().mockResolvedValue({}) })

		await expect(runLogin(deps, [], ['node', 'test'])).rejects.toThrow(/ASANA_CLIENT_ID/)
	})

	it('passes the requested scopes through to the flow', async () => {
		const deps = loginDeps()

		await runLogin(deps, ['--scope', 'tasks:read,projects:read'])

		expect(deps.login).toHaveBeenCalledWith(expect.objectContaining({ scopes: ['tasks:read', 'projects:read'] }))
	})
})

describe('auth token', () => {
	const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
	const originalArgv = [...process.argv]

	afterEach(() => {
		vi.clearAllMocks()
		process.argv = [...originalArgv]
	})

	const NOW = 1_000_000

	function tokenDeps(overrides: Record<string, unknown> = {}) {
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
		}
	}

	async function runToken(deps: Record<string, unknown>, args: string[] = []) {
		const program = new Command().addCommand(authCommand(deps as never))
		process.argv = ['node', 'test']
		await program.parseAsync(['node', 'test', 'auth', 'token', ...args], { from: 'node' })
		return logSpy.mock.calls.map((call) => String(call[0])).join('\n')
	}

	it('prints the stored access token for shell substitution', async () => {
		const out = await runToken(tokenDeps())

		expect(out.trim()).toBe('stored-token')
	})

	it('leaves a token that is still valid alone', async () => {
		const deps = tokenDeps()

		await runToken(deps)

		expect(deps.refreshAccessToken).not.toHaveBeenCalled()
	})

	it('refreshes a token that is about to expire', async () => {
		const deps = tokenDeps({
			readCredentials: vi.fn().mockResolvedValue({
				accessToken: 'stale-token',
				refreshToken: 'refresh-token',
				expiresAt: NOW + 5_000,
			}),
		})

		const out = await runToken(deps)

		expect(deps.refreshAccessToken).toHaveBeenCalledWith(
			expect.objectContaining({ refreshToken: 'refresh-token', clientId: 'client-123' }),
			expect.anything(),
		)
		expect(out.trim()).toBe('refreshed-token')
	})

	it('persists the refreshed token so the next command does not refresh again', async () => {
		const deps = tokenDeps({
			readCredentials: vi.fn().mockResolvedValue({
				accessToken: 'stale-token',
				refreshToken: 'refresh-token',
				expiresAt: NOW + 5_000,
			}),
		})

		await runToken(deps)

		expect(deps.writeCredentials).toHaveBeenCalledWith(
			'/tmp/cyber-asana-test',
			expect.objectContaining({ accessToken: 'refreshed-token' }),
		)
	})

	it('tells the user to log in when nothing is stored', async () => {
		const deps = tokenDeps({ readCredentials: vi.fn().mockResolvedValue(undefined) })

		await expect(runToken(deps)).rejects.toThrow(/auth login/)
	})

	it('reports that an expired token cannot be refreshed without a refresh token', async () => {
		const deps = tokenDeps({
			readCredentials: vi.fn().mockResolvedValue({ accessToken: 'stale-token', expiresAt: NOW + 5_000 }),
		})

		await expect(runToken(deps)).rejects.toThrow(/auth login/)
	})
})

describe('auth logout', () => {
	const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
	const originalArgv = [...process.argv]

	afterEach(() => {
		vi.clearAllMocks()
		process.argv = [...originalArgv]
	})

	function logoutDeps(overrides: Record<string, unknown> = {}) {
		return {
			configDir: () => '/tmp/cyber-asana-test',
			readSettings: vi.fn().mockResolvedValue({ client_id: 'client-123', client_secret: 'secret-456' }),
			readCredentials: vi.fn().mockResolvedValue({
				accessToken: 'stored-token',
				refreshToken: 'refresh-token',
				expiresAt: 2_000_000,
			}),
			revokeRefreshToken: vi.fn().mockResolvedValue(undefined),
			deleteCredentials: vi.fn().mockResolvedValue(true),
			...overrides,
		}
	}

	async function runLogout(deps: Record<string, unknown>, args: string[] = []) {
		const program = new Command().addCommand(authCommand(deps as never))
		process.argv = ['node', 'test']
		await program.parseAsync(['node', 'test', 'auth', 'logout', ...args], { from: 'node' })
		return logSpy.mock.calls.map((call) => String(call[0])).join('\n')
	}

	it('revokes the grant before forgetting the refresh token', async () => {
		const order: string[] = []
		const deps = logoutDeps({
			revokeRefreshToken: vi.fn(async () => {
				order.push('revoke')
			}),
			deleteCredentials: vi.fn(async () => {
				order.push('delete')
				return true
			}),
		})

		await runLogout(deps)

		expect(order).toEqual(['revoke', 'delete'])
	})

	it('deletes the local credentials without revoking when asked to stay local', async () => {
		const deps = logoutDeps()

		await runLogout(deps, ['--local'])

		expect(deps.revokeRefreshToken).not.toHaveBeenCalled()
		expect(deps.deleteCredentials).toHaveBeenCalled()
	})

	it('still forgets the credentials when revocation fails, and says so', async () => {
		const deps = logoutDeps({ revokeRefreshToken: vi.fn().mockRejectedValue(new Error('invalid_client')) })

		const out = await runLogout(deps)

		expect(deps.deleteCredentials).toHaveBeenCalled()
		expect(out).toMatch(/invalid_client|could not revoke/i)
	})

	it('reports already logged out rather than failing', async () => {
		const deps = logoutDeps({
			readCredentials: vi.fn().mockResolvedValue(undefined),
			deleteCredentials: vi.fn().mockResolvedValue(false),
		})

		const out = await runLogout(deps)

		expect(deps.revokeRefreshToken).not.toHaveBeenCalled()
		expect(out).toMatch(/not logged in|already/i)
	})
})
