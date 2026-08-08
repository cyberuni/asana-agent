import { defineListPaginationAcceptanceSpecs } from '../testing/list-pagination.acceptance.js'
import type { MembershipApi } from './api.js'
import type { MembershipFilters } from './gateway.js'

export type MembershipListPaginationAcceptanceDeps = {
	getApi: () => Pick<MembershipApi, 'listMemberships'>
	filters: MembershipFilters
	includeFetchAll?: boolean
}

export function defineMembershipListPaginationAcceptanceSpecs(deps: MembershipListPaginationAcceptanceDeps) {
	return defineListPaginationAcceptanceSpecs({
		list: (opts) => deps.getApi().listMemberships(deps.filters, opts),
		includeFetchAll: deps.includeFetchAll,
	})
}
