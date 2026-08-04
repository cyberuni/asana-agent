import { randomBytes } from 'node:crypto'
import { type CallbackServer, startCallbackServer } from './loopback.js'
import { buildAuthorizeUrl, createPkcePair, exchangeCode, type Tokens } from './oauth.js'
import type { AppCredentials } from './settings.js'

// Orchestrates the browser round-trip: start listening, send the user to
// Asana, catch the redirect, trade the code for tokens. Every collaborator is
// injected so the whole flow can be exercised without a browser or a socket.

export type LoginDeps = {
	startCallbackServer: (opts: { port: number; expectedState: string }) => Promise<CallbackServer>
	openBrowser: (url: string) => Promise<void>
	/** Reads the code the user pastes back in manual mode. */
	promptForCode: () => Promise<string>
	exchangeCode: typeof exchangeCode
	createPkcePair: typeof createPkcePair
	createState: () => string
	/** Progress for a human, kept off stdout so --raw stays pipeable. */
	announce: (message: string) => void
}

export type LoginParams = {
	app: AppCredentials
	port: number
	scopes?: string[]
	/** Ask Asana to show the code instead of redirecting — for headless or SSH sessions. */
	manual?: boolean
	/** An explicitly registered redirect URL, when the loopback default is not the one on file. */
	redirectUri?: string
}

/** Asana's documented redirect for native and command line apps. */
const OOB_REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'

function createState(): string {
	return randomBytes(16).toString('base64url')
}

export function defaultLoginDeps(): LoginDeps {
	return {
		startCallbackServer,
		openBrowser: defaultOpenBrowser,
		exchangeCode,
		createPkcePair,
		createState,
		promptForCode: defaultPromptForCode,
		announce: (message) => process.stderr.write(`${message}\n`),
	}
}

export async function performLogin(
	{ app, port, scopes, manual, redirectUri }: LoginParams,
	deps: LoginDeps,
): Promise<Tokens> {
	const state = deps.createState()
	const { verifier, challenge } = deps.createPkcePair()

	// Manual mode has nothing to listen for: Asana displays the code in the
	// browser rather than redirecting anywhere.
	if (manual) {
		const authorizeUrl = buildAuthorizeUrl({
			clientId: app.clientId,
			redirectUri: OOB_REDIRECT_URI,
			state,
			challenge,
			scopes,
		})
		deps.announce(`Open this URL to authorize, then paste the code Asana shows you:\n\n${authorizeUrl}\n`)
		const code = (await deps.promptForCode()).trim()
		if (!code) throw new Error('No authorization code was entered.')
		return await deps.exchangeCode(
			{ clientId: app.clientId, clientSecret: app.clientSecret, redirectUri: OOB_REDIRECT_URI, code, verifier },
			{ fetch: globalThis.fetch, now: () => Date.now() },
		)
	}

	const server = await deps.startCallbackServer({ port, expectedState: state })
	const effectiveRedirectUri = redirectUri ?? server.redirectUri

	try {
		const authorizeUrl = buildAuthorizeUrl({
			clientId: app.clientId,
			redirectUri: effectiveRedirectUri,
			state,
			challenge,
			scopes,
		})
		// Announce before opening: on WSL and headless boxes the opener is a
		// no-op, and without the URL on screen the command just appears to hang.
		deps.announce(`Opening your browser to authorize. If it does not open, visit:\n\n${authorizeUrl}\n`)
		await deps.openBrowser(authorizeUrl)
		const code = await server.waitForCode
		return await deps.exchangeCode(
			{
				clientId: app.clientId,
				clientSecret: app.clientSecret,
				redirectUri: effectiveRedirectUri,
				code,
				verifier,
			},
			{ fetch: globalThis.fetch, now: () => Date.now() },
		)
	} finally {
		await server.close()
	}
}

async function defaultPromptForCode(): Promise<string> {
	const { createInterface } = await import('node:readline/promises')
	const rl = createInterface({ input: process.stdin, output: process.stderr })
	try {
		return await rl.question('Authorization code: ')
	} finally {
		rl.close()
	}
}

async function defaultOpenBrowser(url: string): Promise<void> {
	const { spawn } = await import('node:child_process')
	const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
	spawn(opener, [url], { detached: true, stdio: 'ignore', shell: process.platform === 'win32' }).unref()
}
