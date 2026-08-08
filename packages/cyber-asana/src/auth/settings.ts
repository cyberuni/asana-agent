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

// Asana registers two incompatible app types under the same documented env var
// names: an "MCP app", whose tokens only work against Asana's hosted MCP
// server, and an "API app", which is what this CLI's OAuth flow needs. Asana's
// own docs tell you to export the MCP app's pair as ASANA_CLIENT_ID/_SECRET, so
// a dual-MCP setup needs a name only the API app answers to — hence the
// ASANA_API_ prefixed pair, which wins. The shared pair stays as a fallback so
// every setup that predates the split keeps working.
// https://developers.asana.com/docs/integrating-with-asanas-mcp-server
const CLIENT_ID_ENV_VARS = ['ASANA_API_CLIENT_ID', 'ASANA_CLIENT_ID'] as const
const CLIENT_SECRET_ENV_VARS = ['ASANA_API_CLIENT_SECRET', 'ASANA_CLIENT_SECRET'] as const

export type AppCredentials = {
	clientId: string
	clientSecret?: string
	/**
	 * Label of the winning source — `flags`, `settings.json`, or the exact
	 * environment variable, so an MCP-app id standing in for an API-app id is
	 * diagnosable rather than an unexplained rejection from Asana.
	 */
	source: AppCredentialSource
	/**
	 * Labels of sources that hold a client id but lost to `source`. An MCP app's
	 * pair sitting behind an API app's — or the reverse — is otherwise decided in
	 * silence.
	 */
	shadowed: AppCredentialSource[]
}

export type AppCredentialSource = 'flags' | 'settings.json' | (typeof CLIENT_ID_ENV_VARS)[number]

function firstSet<Name extends string>(
	env: Record<string, string | undefined>,
	names: readonly Name[],
): { name: Name; value: string } | undefined {
	for (const name of names) {
		const value = env[name]
		if (value) return { name, value }
	}
	return undefined
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
	const candidates: Array<{ source: AppCredentialSource; clientId: string }> = []
	if (overrides?.clientId) candidates.push({ source: 'flags', clientId: overrides.clientId })
	for (const name of CLIENT_ID_ENV_VARS) {
		const clientId = env[name]
		if (clientId) candidates.push({ source: name, clientId })
	}
	if (settings.client_id) candidates.push({ source: 'settings.json', clientId: settings.client_id })

	const [winner, ...rest] = candidates
	if (!winner) return undefined

	const envSecret = firstSet(env, CLIENT_SECRET_ENV_VARS)
	return {
		clientId: winner.clientId,
		// The secret resolves per field, so a client id from one source can pair
		// with a secret from another — the same rule as before.
		clientSecret: overrides?.clientSecret || envSecret?.value || settings.client_secret,
		source: winner.source,
		shadowed: rest.map((candidate) => candidate.source),
	}
}
