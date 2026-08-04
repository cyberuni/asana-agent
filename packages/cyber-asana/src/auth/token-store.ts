import { chmod, mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Tokens } from './oauth.js'

// Machine-owned and rewritten on every refresh — which is exactly why it is a
// separate file from settings.json. On disk the fields are snake_case to match
// the rest of the tool's JSON, and schema_version leaves room to migrate.

const CREDENTIALS_FILE = 'credentials.json'
const OWNER_ONLY = 0o600
const SCHEMA_VERSION = 1

type StoredCredentials = {
	schema_version: number
	access_token: string
	refresh_token?: string
	expires_at: number
	user?: { gid: string; name?: string; email?: string }
}

function isMissing(error: unknown): boolean {
	return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
}

export async function readCredentials(dir: string): Promise<Tokens | undefined> {
	const path = join(dir, CREDENTIALS_FILE)
	let raw: string
	try {
		raw = await readFile(path, 'utf-8')
	} catch (error) {
		if (isMissing(error)) return undefined
		throw error
	}

	let stored: StoredCredentials
	try {
		stored = JSON.parse(raw) as StoredCredentials
	} catch {
		throw new Error(`Could not parse ${path}. Run \`cyber-asana auth login\` to replace it.`)
	}
	return {
		accessToken: stored.access_token,
		refreshToken: stored.refresh_token,
		expiresAt: stored.expires_at,
		user: stored.user,
	}
}

export async function writeCredentials(dir: string, tokens: Tokens): Promise<void> {
	await mkdir(dir, { recursive: true })
	const stored: StoredCredentials = {
		schema_version: SCHEMA_VERSION,
		access_token: tokens.accessToken,
		refresh_token: tokens.refreshToken,
		expires_at: tokens.expiresAt,
		user: tokens.user,
	}
	const path = join(dir, CREDENTIALS_FILE)
	await writeFile(path, `${JSON.stringify(stored, null, '\t')}\n`, { mode: OWNER_ONLY })
	// `mode` on writeFile only applies when creating the file.
	await chmod(path, OWNER_ONLY)
}

/** Returns whether anything was there to delete, so logout can stay idempotent. */
export async function deleteCredentials(dir: string): Promise<boolean> {
	try {
		await unlink(join(dir, CREDENTIALS_FILE))
		return true
	} catch (error) {
		if (isMissing(error)) return false
		throw error
	}
}
