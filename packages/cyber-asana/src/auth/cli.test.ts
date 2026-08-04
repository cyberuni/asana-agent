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
		const program = new Command().addCommand(authCommand(() => credential as never))
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
