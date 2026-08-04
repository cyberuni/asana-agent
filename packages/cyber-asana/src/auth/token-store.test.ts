import { mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { deleteCredentials, readCredentials, writeCredentials } from './token-store.js'

describe('credentials store', () => {
	let dir: string | undefined

	afterEach(async () => {
		if (dir) await rm(dir, { recursive: true, force: true })
		dir = undefined
	})

	async function tempDir() {
		dir = await mkdtemp(join(tmpdir(), 'cyber-asana-creds-'))
		return join(dir, 'cyber-asana')
	}

	const tokens = {
		accessToken: 'access-token',
		refreshToken: 'refresh-token',
		expiresAt: 1_700_000_000_000,
		user: { gid: '1201', name: 'Homa Wong', email: 'homa@example.com' },
	}

	it('reads nothing when no credentials have been stored', async () => {
		expect(await readCredentials(await tempDir())).toBeUndefined()
	})

	it('round-trips the tokens, the expiry, and the account', async () => {
		const target = await tempDir()

		await writeCredentials(target, tokens)

		expect(await readCredentials(target)).toEqual(tokens)
	})

	it('stores credentials readable only by their owner', async () => {
		const target = await tempDir()

		await writeCredentials(target, tokens)

		const info = await stat(join(target, 'credentials.json'))
		expect(info.mode & 0o777).toBe(0o600)
	})

	it('tightens permissions on a credentials file that was already world-readable', async () => {
		const target = await tempDir()
		await writeCredentials(target, tokens)
		await writeFile(join(target, 'credentials.json'), '{}', { mode: 0o644 })

		await writeCredentials(target, tokens)

		const info = await stat(join(target, 'credentials.json'))
		expect(info.mode & 0o777).toBe(0o600)
	})

	it('names the file when its contents cannot be parsed', async () => {
		const target = await tempDir()
		await writeCredentials(target, tokens)
		await writeFile(join(target, 'credentials.json'), 'not json')

		await expect(readCredentials(target)).rejects.toThrow(/credentials\.json/)
	})

	it('reports that it deleted stored credentials', async () => {
		const target = await tempDir()
		await writeCredentials(target, tokens)

		expect(await deleteCredentials(target)).toBe(true)
		expect(await readCredentials(target)).toBeUndefined()
	})

	it('reports nothing to delete rather than failing when already logged out', async () => {
		expect(await deleteCredentials(await tempDir())).toBe(false)
	})
})
