import { defineListPaginationAcceptanceSpecs } from '../testing/list-pagination.acceptance.js'
import type { TaskTemplateApi } from './api.js'

export type TaskTemplateListPaginationAcceptanceDeps = {
	getApi: () => Pick<TaskTemplateApi, 'listTaskTemplates'>
	projectGid: string
	includeFetchAll?: boolean
}

export function defineTaskTemplateListPaginationAcceptanceSpecs(deps: TaskTemplateListPaginationAcceptanceDeps) {
	return defineListPaginationAcceptanceSpecs({
		list: (opts) => deps.getApi().listTaskTemplates(deps.projectGid, opts),
		includeFetchAll: deps.includeFetchAll,
	})
}
