import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'

// The browser half of the flow: a one-shot local server that catches Asana's
// redirect. It binds to the loopback interface only — the authorization code
// arrives in a query string, and nothing off this machine should be able to
// reach the socket that receives it.

const CALLBACK_PATH = '/callback'

const DONE_PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><title>cyber-asana</title></head>
<body style="font-family: system-ui; padding: 3rem; text-align: center">
<h1>Authorization complete</h1>
<p>You can close this tab and return to your terminal.</p>
</body></html>
`

export type CallbackServer = {
	port: number
	/** What the Asana app registration must list as its redirect URL. */
	redirectUri: string
	waitForCode: Promise<string>
	close: () => Promise<void>
}

export type CallbackServerOptions = {
	port: number
	expectedState: string
	/** Registration matches on host name, so this stays configurable. */
	host?: string
}

export async function startCallbackServer({
	port,
	expectedState,
	host = 'localhost',
}: CallbackServerOptions): Promise<CallbackServer> {
	let settle: { resolve: (code: string) => void; reject: (error: Error) => void }
	const waitForCode = new Promise<string>((resolve, reject) => {
		settle = { resolve, reject }
	})

	// The redirect can arrive before the caller awaits, and a rejection with no
	// handler yet would surface as an unhandled rejection. This marks it handled
	// without consuming it — whoever awaits waitForCode still sees the error.
	waitForCode.catch(() => {})

	const server = createServer((req, res) => {
		const url = new URL(req.url ?? '/', `http://${host}`)
		if (url.pathname !== CALLBACK_PATH) {
			res.writeHead(404).end()
			return
		}

		res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(DONE_PAGE)

		const error = url.searchParams.get('error')
		if (error) {
			const description = url.searchParams.get('error_description') ?? error
			settle.reject(new Error(`Asana did not authorize the request: ${description}`))
			return
		}
		// The state proves this redirect belongs to the flow we started, not one
		// a third party induced the browser to follow.
		if (url.searchParams.get('state') !== expectedState) {
			settle.reject(new Error('Ignoring callback: the state did not match the one this login issued.'))
			return
		}
		const code = url.searchParams.get('code')
		if (!code) {
			settle.reject(new Error('Asana redirected without an authorization code.'))
			return
		}
		settle.resolve(code)
	})

	await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve))
	const bound = (server.address() as AddressInfo).port

	return {
		port: bound,
		redirectUri: `http://${host}:${bound}${CALLBACK_PATH}`,
		waitForCode,
		close: () =>
			new Promise<void>((resolve) => {
				server.close(() => resolve())
				server.closeAllConnections()
			}),
	}
}
