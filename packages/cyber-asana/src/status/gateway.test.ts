import Asana from 'asana'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAsanaStatusGateway } from './gateway.js'

function stubStatusList() {
	return vi
		.spyOn(Asana.StatusUpdatesApi.prototype, 'getStatusesForObject')
		.mockResolvedValue({ data: [], next_page: null } as never)
}

describe('status/gateway listStatuses', () => {
	afterEach(() => vi.restoreAllMocks())

	it('forwards created_since to the status listing endpoint', async () => {
		const listSpy = stubStatusList()
		const gateway = createAsanaStatusGateway({} as Asana.ApiClient)

		await gateway.listStatuses('proj1', { createdSince: '2026-01-01T00:00:00Z' })

		expect(listSpy).toHaveBeenCalledWith('proj1', expect.objectContaining({ created_since: '2026-01-01T00:00:00Z' }))
	})

	it('sends no created_since when the caller gave none', async () => {
		const listSpy = stubStatusList()
		const gateway = createAsanaStatusGateway({} as Asana.ApiClient)

		await gateway.listStatuses('proj1', { limit: 25 })

		expect(listSpy.mock.calls[0][1]).not.toHaveProperty('created_since')
	})
})
