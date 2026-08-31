import Asana from 'asana'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAsanaSectionGateway } from './gateway.js'

function stubCreateSection() {
	return vi
		.spyOn(Asana.SectionsApi.prototype, 'createSectionForProject')
		.mockResolvedValue({ data: { gid: 'sec1', name: 'In Progress' } } as never)
}

function bodyDataOf(call: unknown) {
	return (call as { body: { data: Record<string, unknown> } }).body.data
}

describe('sections/gateway createSection placement', () => {
	afterEach(() => vi.restoreAllMocks())

	it('sends insert_before so a new section can land above an existing one', async () => {
		const spy = stubCreateSection()
		const gateway = createAsanaSectionGateway({} as Asana.ApiClient)

		await gateway.createSection('proj1', 'In Progress', { insertBefore: 'sec2' })

		expect(bodyDataOf(spy.mock.calls[0][1])).toEqual({ name: 'In Progress', insert_before: 'sec2' })
	})

	it('sends insert_after so a new section can land below an existing one', async () => {
		const spy = stubCreateSection()
		const gateway = createAsanaSectionGateway({} as Asana.ApiClient)

		await gateway.createSection('proj1', 'In Progress', { insertAfter: 'sec2' })

		expect(bodyDataOf(spy.mock.calls[0][1])).toEqual({ name: 'In Progress', insert_after: 'sec2' })
	})

	it('sends only the name when no placement is requested', async () => {
		const spy = stubCreateSection()
		const gateway = createAsanaSectionGateway({} as Asana.ApiClient)

		await gateway.createSection('proj1', 'In Progress')

		expect(bodyDataOf(spy.mock.calls[0][1])).toEqual({ name: 'In Progress' })
	})
})
