import { describe, expect, it, vi } from 'vitest'
import { createPaginatingScopedListMock } from '../testing/paginating-gateway.js'
import { createCustomFieldApi } from './api.js'
import type { CustomFieldGateway } from './gateway.js'
import { defineCustomFieldListPaginationAcceptanceSpecs } from './list-pagination.acceptance.js'

const workspaceGid = 'ws-test'
const pages = [
	[{ gid: 'cf1', name: 'Priority', resource_subtype: 'enum' }],
	[{ gid: 'cf2', name: 'Estimate', resource_subtype: 'number' }],
	[{ gid: 'cf3', name: 'Owner note', resource_subtype: 'text' }],
]

function createPaginatingCustomFieldGateway(): CustomFieldGateway {
	return {
		listCustomFields: createPaginatingScopedListMock(pages),
		getCustomField: vi.fn(),
	}
}

describe(
	'custom-fields/list pagination acceptance',
	defineCustomFieldListPaginationAcceptanceSpecs({
		getApi: () => createCustomFieldApi(createPaginatingCustomFieldGateway()),
		workspaceGid,
	}),
)

describe('custom-fields/list pagination acceptance gateway double', () => {
	it('exercises listCustomFields without importing the Asana SDK', async () => {
		const gateway = createPaginatingCustomFieldGateway()
		const api = createCustomFieldApi(gateway)

		const result = await api.listCustomFields(workspaceGid, { limit: 25 })

		expect(result).toEqual({
			data: [{ gid: 'cf1', name: 'Priority', resource_subtype: 'enum' }],
			next_page: { offset: 'page2' },
			limit: 25,
		})
		expect(gateway.listCustomFields).toHaveBeenCalledWith(workspaceGid, { limit: 25 })
	})
})
