import { defineListPaginationAcceptanceSpecs } from '../testing/list-pagination.acceptance.js'
import type { ProjectTemplateApi } from './api.js'

export type ProjectTemplateListPaginationAcceptanceDeps = {
	getApi: () => Pick<ProjectTemplateApi, 'listProjectTemplates'>
	workspaceGid: string
	includeFetchAll?: boolean
}

export function defineProjectTemplateListPaginationAcceptanceSpecs(deps: ProjectTemplateListPaginationAcceptanceDeps) {
	return defineListPaginationAcceptanceSpecs({
		list: (opts) => deps.getApi().listProjectTemplates({ workspace: deps.workspaceGid }, opts),
		includeFetchAll: deps.includeFetchAll,
	})
}
