import { describe, expect, it, vi } from 'vitest'
import { paginatingListResult } from '../testing/paginating-gateway.js'
import { createOooApi } from './api.js'
import type { OooGateway } from './gateway.js'
import { defineOooListPaginationAcceptanceSpecs } from './list-pagination.acceptance.js'

const userGid = 'user-test'
const workspaceGid = 'ws-test'

const pages = [
	[{ gid: 'ooo1', start_date: '2026-01-01', end_date: '2026-01-05' }],
	[{ gid: 'ooo2', start_date: '2026-02-01', end_date: '2026-02-05' }],
	[{ gid: 'ooo3', start_date: '2026-03-01', end_date: '2026-03-05' }],
]

function createPaginatingOooGateway(): OooGateway {
	return {
		listOooEntries: vi.fn(async (_userGid, _workspaceGid, opts) => paginatingListResult(pages, opts)),
		getOooEntry: vi.fn(),
		createOooEntry: vi.fn(),
		updateOooEntry: vi.fn(),
		deleteOooEntry: vi.fn(),
	}
}

describe(
	'ooo/list pagination acceptance',
	defineOooListPaginationAcceptanceSpecs({
		getApi: () => createOooApi(createPaginatingOooGateway()),
		userGid,
		workspaceGid,
	}),
)

describe('ooo/list pagination acceptance gateway double', () => {
	it('exercises listOooEntries without importing the Asana SDK', async () => {
		const gateway = createPaginatingOooGateway()
		const api = createOooApi(gateway)

		const result = await api.listOooEntries(userGid, workspaceGid, { limit: 25 })

		expect(result).toEqual({
			data: pages[0],
			next_page: { offset: 'page2' },
			limit: 25,
		})
		expect(gateway.listOooEntries).toHaveBeenCalledWith(userGid, workspaceGid, { limit: 25 })
	})
})
