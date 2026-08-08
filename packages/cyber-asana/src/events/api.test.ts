import { describe, expect, it, vi } from 'vitest'
import { createEventApi } from './api.js'

const feed = { data: [{ action: 'changed' }], sync: 'tok-2', has_more: false, sync_reset: false }

describe('createEventApi', () => {
	it('uses the provided gateway for getEvents', async () => {
		const getEvents = vi.fn().mockResolvedValue(feed)
		const api = createEventApi({ getEvents })

		const result = await api.getEvents('proj1', { sync: 'tok-1' })

		expect(result).toEqual(feed)
		expect(getEvents).toHaveBeenCalledWith('proj1', { sync: 'tok-1' })
	})

	it('passes no options through when the caller gives none', async () => {
		const getEvents = vi.fn().mockResolvedValue({ data: [], sync: 'tok-1', has_more: false, sync_reset: true })
		const api = createEventApi({ getEvents })

		await api.getEvents('proj1')

		expect(getEvents).toHaveBeenCalledWith('proj1', undefined)
	})
})
