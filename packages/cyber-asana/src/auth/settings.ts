import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

// The app registration you own: stable, hand-edited, and never rewritten by
// the CLI. Tokens live in credentials.json instead, so a token refresh can
// never clobber a file the user maintains — and logout can delete the
// credentials outright without destroying the registration.

const SETTINGS_FILE = 'settings.json'
const OWNER_ONLY = 0o600

export type AppSettings = {
	client_id?: string
	client_secret?: string
}

export function configDir(env: Record<string, string | undefined> = process.env): string {
	const base = env.XDG_CONFIG_HOME || join(homedir(), '.config')
	return join(base, 'cyber-asana')
}

export async function readSettings(dir: string): Promise<AppSettings> {
	const path = join(dir, SETTINGS_FILE)
	let raw: string
	try {
		raw = await readFile(path, 'utf-8')
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return {}
		throw error
	}
	try {
		return JSON.parse(raw) as AppSettings
	} catch {
		throw new Error(`Could not parse ${path}. Fix or delete the file, then try again.`)
	}
}

export async function writeSettings(dir: string, settings: AppSettings): Promise<void> {
	await mkdir(dir, { recursive: true })
	const path = join(dir, SETTINGS_FILE)
	await writeFile(path, `${JSON.stringify(settings, null, '\t')}\n`, { mode: OWNER_ONLY })
	// `mode` on writeFile only applies when creating; an existing file keeps
	// whatever permissions it had, so tighten it explicitly.
	await chmod(path, OWNER_ONLY)
}

export type AppCredentials = {
	clientId: string
	clientSecret?: string
	source: 'flags' | 'environment' | 'settings.json'
}

export function resolveAppCredentials({
	settings,
	env = process.env,
	overrides,
}: {
	settings: AppSettings
	env?: Record<string, string | undefined>
	/** Values passed on the command line — highest precedence. */
	overrides?: { clientId?: string; clientSecret?: string }
}): AppCredentials | undefined {
	const clientId = overrides?.clientId || env.ASANA_CLIENT_ID || settings.client_id
	if (!clientId) return undefined
	return {
		clientId,
		clientSecret: overrides?.clientSecret || env.ASANA_CLIENT_SECRET || settings.client_secret,
		source: overrides?.clientId ? 'flags' : env.ASANA_CLIENT_ID ? 'environment' : 'settings.json',
	}
}
