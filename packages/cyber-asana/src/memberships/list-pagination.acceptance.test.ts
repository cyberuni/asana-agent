import { describe, expect, it, vi } from 'vitest'
import { createPaginatingScopedListMock } from '../testing/paginating-gateway.js'
import { createMembershipApi } from './api.js'
import type { MembershipGateway } from './gateway.js'
import { defineMembershipListPaginationAcceptanceSpecs } from './list-pagination.acceptance.js'

const filters = { parent: 'proj-test' }
const pages = [
	[{ gid: 'm1', member: { gid: 'u1', name: 'Ada' } }],
	[{ gid: 'm2', member: { gid: 'u2', name: 'Grace' } }],
	[{ gid: 'm3', member: { gid: 'u3', name: 'Alan' } }],
]

function createPaginatingMembershipGateway(): MembershipGateway {
	return {
		listMemberships: createPaginatingScopedListMock(pages) as unknown as MembershipGateway['listMemberships'],
		getMembership: vi.fn(),
		createMembership: vi.fn(),
		updateMembership: vi.fn(),
		deleteMembership: vi.fn(),
	}
}

describe(
	'memberships/list pagination acceptance',
	defineMembershipListPaginationAcceptanceSpecs({
		getApi: () => createMembershipApi(createPaginatingMembershipGateway()),
		filters,
	}),
)

describe('memberships/list pagination acceptance gateway double', () => {
	it('exercises listMemberships without importing the Asana SDK', async () => {
		const gateway = createPaginatingMembershipGateway()
		const api = createMembershipApi(gateway)

		const result = await api.listMemberships(filters, { limit: 25 })

		expect(result).toEqual({
			data: [{ gid: 'm1', member: { gid: 'u1', name: 'Ada' } }],
			next_page: { offset: 'page2' },
			limit: 25,
		})
		expect(gateway.listMemberships).toHaveBeenCalledWith(filters, { limit: 25 })
	})
})
