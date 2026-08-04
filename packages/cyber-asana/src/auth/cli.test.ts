import { Command } from 'commander'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { authCommand } from './cli.js'

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
