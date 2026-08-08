import { defineListPaginationAcceptanceSpecs } from '../testing/list-pagination.acceptance.js'
import type { CustomFieldApi } from './api.js'

export type CustomFieldListPaginationAcceptanceDeps = {
	getApi: () => Pick<CustomFieldApi, 'listCustomFields'>
	workspaceGid: string
	includeFetchAll?: boolean
}

export function defineCustomFieldListPaginationAcceptanceSpecs(deps: CustomFieldListPaginationAcceptanceDeps) {
	return defineListPaginationAcceptanceSpecs({
		list: (opts) => deps.getApi().listCustomFields(deps.workspaceGid, opts),
		includeFetchAll: deps.includeFetchAll,
	})
}
