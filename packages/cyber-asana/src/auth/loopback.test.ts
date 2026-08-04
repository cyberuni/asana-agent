import { describe, expect, it } from 'vitest'
import { startCallbackServer } from './loopback.js'

describe('startCallbackServer', () => {
	async function withServer<T>(
		expectedState: string,
		use: (server: Awaited<ReturnType<typeof startCallbackServer>>) => Promise<T>,
	): Promise<T> {
		const server = await startCallbackServer({ port: 0, expectedState })
		try {
			return await use(server)
		} finally {
			await server.close()
		}
	}

	function callback(port: number, query: string) {
		return fetch(`http://127.0.0.1:${port}/callback?${query}`)
	}

	it('resolves with the authorization code when the state matches', async () => {
		await withServer('state-abc', async (server) => {
			await callback(server.port, 'code=auth-code&state=state-abc')

			await expect(server.waitForCode).resolves.toBe('auth-code')
		})
	})

	it('reports the redirect URI the app must register', async () => {
		await withServer('state-abc', async (server) => {
			expect(server.redirectUri).toBe(`http://localhost:${server.port}/callback`)
			await callback(server.port, 'code=auth-code&state=state-abc')
			await server.waitForCode
		})
	})

	it('rejects a callback whose state does not match the one it issued', async () => {
		await withServer('state-abc', async (server) => {
			await callback(server.port, 'code=auth-code&state=forged')

			await expect(server.waitForCode).rejects.toThrow(/state/i)
		})
	})

	it('rejects when the user declines the authorization', async () => {
		await withServer('state-abc', async (server) => {
			await callback(server.port, 'error=access_denied&error_description=User+denied&state=state-abc')

			await expect(server.waitForCode).rejects.toThrow(/User denied/)
		})
	})

	it('tells the browser the flow is finished so the user returns to the terminal', async () => {
		await withServer('state-abc', async (server) => {
			const res = await callback(server.port, 'code=auth-code&state=state-abc')

			expect(res.status).toBe(200)
			expect(await res.text()).toMatch(/terminal/i)
			await server.waitForCode
		})
	})

	it('ignores requests to other paths', async () => {
		await withServer('state-abc', async (server) => {
			const stray = await fetch(`http://127.0.0.1:${server.port}/favicon.ico`)
			expect(stray.status).toBe(404)

			await callback(server.port, 'code=auth-code&state=state-abc')

			await expect(server.waitForCode).resolves.toBe('auth-code')
		})
	})
})
