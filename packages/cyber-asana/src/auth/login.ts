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
	exchangeCode: typeof exchangeCode
	createPkcePair: typeof createPkcePair
	createState: () => string
}

export type LoginParams = {
	app: AppCredentials
	port: number
	scopes?: string[]
}

export function createState(): string {
	return randomBytes(16).toString('base64url')
}

export function defaultLoginDeps(): LoginDeps {
	return {
		startCallbackServer,
		openBrowser: defaultOpenBrowser,
		exchangeCode,
		createPkcePair,
		createState,
	}
}

export async function performLogin({ app, port, scopes }: LoginParams, deps: LoginDeps): Promise<Tokens> {
	const state = deps.createState()
	const { verifier, challenge } = deps.createPkcePair()
	const server = await deps.startCallbackServer({ port, expectedState: state })

	try {
		await deps.openBrowser(
			buildAuthorizeUrl({
				clientId: app.clientId,
				redirectUri: server.redirectUri,
				state,
				challenge,
				scopes,
			}),
		)
		const code = await server.waitForCode
		return await deps.exchangeCode(
			{
				clientId: app.clientId,
				clientSecret: app.clientSecret,
				redirectUri: server.redirectUri,
				code,
				verifier,
			},
			{ fetch: globalThis.fetch, now: () => Date.now() },
		)
	} finally {
		await server.close()
	}
}

async function defaultOpenBrowser(url: string): Promise<void> {
	const { spawn } = await import('node:child_process')
	const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
	spawn(opener, [url], { detached: true, stdio: 'ignore', shell: process.platform === 'win32' }).unref()
}
