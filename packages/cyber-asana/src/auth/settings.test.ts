import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { configDir, readSettings, resolveAppCredentials, writeSettings } from './settings.js'

describe('configDir', () => {
	it('uses XDG_CONFIG_HOME when set', () => {
		expect(configDir({ XDG_CONFIG_HOME: '/custom/config' })).toBe('/custom/config/cyber-asana')
	})

	it('falls back to ~/.config when XDG_CONFIG_HOME is unset', () => {
		expect(configDir({})).toBe(join(homedir(), '.config', 'cyber-asana'))
	})

	it('ignores an empty XDG_CONFIG_HOME', () => {
		expect(configDir({ XDG_CONFIG_HOME: '' })).toBe(join(homedir(), '.config', 'cyber-asana'))
	})
})

describe('settings file', () => {
	let dir: string | undefined

	afterEach(async () => {
		if (dir) await rm(dir, { recursive: true, force: true })
		dir = undefined
	})

	async function tempDir() {
		dir = await mkdtemp(join(tmpdir(), 'cyber-asana-settings-'))
		return join(dir, 'cyber-asana')
	}

	it('reads empty settings when the file does not exist', async () => {
		expect(await readSettings(await tempDir())).toEqual({})
	})

	it('round-trips the app registration', async () => {
		const target = await tempDir()

		await writeSettings(target, { client_id: 'client-123', client_secret: 'secret-456' })

		expect(await readSettings(target)).toEqual({ client_id: 'client-123', client_secret: 'secret-456' })
	})

	it('writes the settings file readable only by its owner', async () => {
		const target = await tempDir()

		await writeSettings(target, { client_id: 'client-123' })

		const info = await stat(join(target, 'settings.json'))
		expect(info.mode & 0o777).toBe(0o600)
	})

	it('tightens permissions on a file that was already world-readable', async () => {
		const target = await tempDir()
		await writeSettings(target, { client_id: 'first' })
		await writeFile(join(target, 'settings.json'), '{}', { mode: 0o644 })

		await writeSettings(target, { client_id: 'second' })

		const info = await stat(join(target, 'settings.json'))
		expect(info.mode & 0o777).toBe(0o600)
	})

	it('names the file when its contents cannot be parsed', async () => {
		const target = await tempDir()
		await writeSettings(target, { client_id: 'client-123' })
		await writeFile(join(target, 'settings.json'), 'not json')

		await expect(readSettings(target)).rejects.toThrow(/settings\.json/)
	})

	it('writes readable JSON so the file can be hand-edited', async () => {
		const target = await tempDir()

		await writeSettings(target, { client_id: 'client-123' })

		expect(await readFile(join(target, 'settings.json'), 'utf-8')).toContain('\n')
	})
})

describe('resolveAppCredentials', () => {
	it('uses the settings file when no environment variables are set', () => {
		const result = resolveAppCredentials({
			settings: { client_id: 'file-id', client_secret: 'file-secret' },
			env: {},
		})
		expect(result).toEqual({ clientId: 'file-id', clientSecret: 'file-secret', source: 'settings.json' })
	})

	it('prefers environment variables over the settings file', () => {
		const result = resolveAppCredentials({
			settings: { client_id: 'file-id', client_secret: 'file-secret' },
			env: { ASANA_CLIENT_ID: 'env-id', ASANA_CLIENT_SECRET: 'env-secret' },
		})
		expect(result).toEqual({ clientId: 'env-id', clientSecret: 'env-secret', source: 'environment' })
	})

	it('reports no registration when neither source has a client id', () => {
		expect(resolveAppCredentials({ settings: {}, env: {} })).toBeUndefined()
	})

	it('prefers explicitly passed credentials over the environment and the file', () => {
		const result = resolveAppCredentials({
			settings: { client_id: 'file-id', client_secret: 'file-secret' },
			env: { ASANA_CLIENT_ID: 'env-id', ASANA_CLIENT_SECRET: 'env-secret' },
			overrides: { clientId: 'flag-id', clientSecret: 'flag-secret' },
		})
		expect(result).toEqual({ clientId: 'flag-id', clientSecret: 'flag-secret', source: 'flags' })
	})

	it('lets a passed client id combine with a secret from the environment', () => {
		const result = resolveAppCredentials({
			settings: {},
			env: { ASANA_CLIENT_SECRET: 'env-secret' },
			overrides: { clientId: 'flag-id' },
		})
		expect(result?.clientId).toBe('flag-id')
		expect(result?.clientSecret).toBe('env-secret')
	})

	it('ignores empty passed credentials', () => {
		const result = resolveAppCredentials({
			settings: { client_id: 'file-id' },
			env: {},
			overrides: { clientId: '' },
		})
		expect(result?.clientId).toBe('file-id')
		expect(result?.source).toBe('settings.json')
	})

	it('takes each field from the highest-precedence source that has it', () => {
		const result = resolveAppCredentials({
			settings: { client_id: 'file-id', client_secret: 'file-secret' },
			env: { ASANA_CLIENT_ID: 'env-id' },
		})
		expect(result?.clientId).toBe('env-id')
		expect(result?.clientSecret).toBe('file-secret')
	})
})
