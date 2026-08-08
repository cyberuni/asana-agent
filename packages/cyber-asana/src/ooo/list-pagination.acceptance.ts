import { defineListPaginationAcceptanceSpecs } from '../testing/list-pagination.acceptance.js'
import type { OooApi } from './api.js'

export type OooListPaginationAcceptanceDeps = {
	getApi: () => Pick<OooApi, 'listOooEntries'>
	userGid: string
	workspaceGid: string
	includeFetchAll?: boolean
}

export function defineOooListPaginationAcceptanceSpecs(deps: OooListPaginationAcceptanceDeps) {
	return defineListPaginationAcceptanceSpecs({
		list: (opts) => deps.getApi().listOooEntries(deps.userGid, deps.workspaceGid, opts),
		includeFetchAll: deps.includeFetchAll,
	})
}
