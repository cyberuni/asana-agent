import { describe, expect, it } from 'vitest'
import { freshSyncTokenFromError, normalizeEventFeed, readEventFeed } from './feed.js'

describe('normalizeEventFeed', () => {
	it('carries the events, the next sync token, and has_more through', () => {
		const feed = normalizeEventFeed({
			data: [{ action: 'changed', resource: { gid: 't1' } }],
			sync: 'tok-2',
			has_more: true,
		})

		expect(feed).toEqual({
			data: [{ action: 'changed', resource: { gid: 't1' } }],
			sync: 'tok-2',
			has_more: true,
			sync_reset: false,
		})
	})

	it('defaults a body without events or has_more to an empty, complete feed', () => {
		expect(normalizeEventFeed({ sync: 'tok-1' })).toEqual({
			data: [],
			sync: 'tok-1',
			has_more: false,
			sync_reset: false,
		})
	})
})

describe('freshSyncTokenFromError', () => {
	it('extracts the fresh token Asana hands back with a 412', () => {
		const error = {
			status: 412,
			response: { status: 412, body: { sync: 'tok-1', errors: [{ message: 'Sync token invalid or too old' }] } },
		}

		expect(freshSyncTokenFromError(error)).toBe('tok-1')
	})

	it('ignores a 412 that carries no replacement token', () => {
		expect(freshSyncTokenFromError({ response: { status: 412, body: { errors: [] } } })).toBeUndefined()
	})

	it('ignores errors that are not a sync-token reset', () => {
		expect(freshSyncTokenFromError({ response: { status: 404, body: { sync: 'tok-1' } } })).toBeUndefined()
		expect(freshSyncTokenFromError(new Error('boom'))).toBeUndefined()
	})
})

describe('readEventFeed', () => {
	it('normalizes the body of a successful call', async () => {
		const feed = await readEventFeed(async () => ({ data: [{ action: 'added' }], sync: 'tok-2', has_more: false }))

		expect(feed).toEqual({ data: [{ action: 'added' }], sync: 'tok-2', has_more: false, sync_reset: false })
	})

	it('turns the 412 handshake into an empty feed carrying the fresh token', async () => {
		const feed = await readEventFeed(async () => {
			throw { response: { status: 412, body: { sync: 'tok-1', errors: [{ message: 'Sync token invalid' }] } } }
		})

		expect(feed).toEqual({ data: [], sync: 'tok-1', has_more: false, sync_reset: true })
	})

	it('rethrows any other failure', async () => {
		await expect(
			readEventFeed(async () => {
				throw new Error('boom')
			}),
		).rejects.toThrow('boom')
	})
})
