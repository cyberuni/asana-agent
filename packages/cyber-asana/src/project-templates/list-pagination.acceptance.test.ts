import { describe, expect, it, vi } from 'vitest'
import { paginatingListResult } from '../testing/paginating-gateway.js'
import { createProjectTemplateApi } from './api.js'
import type { ProjectTemplateGateway } from './gateway.js'
import { defineProjectTemplateListPaginationAcceptanceSpecs } from './list-pagination.acceptance.js'

const workspaceGid = 'ws-test'

const pages = [
	[{ gid: 'tpl1', name: 'Client onboarding' }],
	[{ gid: 'tpl2', name: 'Launch checklist' }],
	[{ gid: 'tpl3', name: 'Quarterly review' }],
]

function createPaginatingProjectTemplateGateway(): ProjectTemplateGateway {
	return {
		listProjectTemplates: vi.fn(async (_filters, opts) => paginatingListResult(pages, opts)),
		listProjectTemplatesForTeam: vi.fn(async (_teamGid, opts) => paginatingListResult(pages, opts)),
		getProjectTemplate: vi.fn(),
		instantiateProject: vi.fn(),
	}
}

function createApi() {
	return createProjectTemplateApi(createPaginatingProjectTemplateGateway(), { jobs: { getJob: vi.fn() } })
}

describe(
	'project-templates/list pagination acceptance',
	defineProjectTemplateListPaginationAcceptanceSpecs({
		getApi: createApi,
		workspaceGid,
	}),
)

describe('project-templates/list pagination acceptance gateway double', () => {
	it('exercises listProjectTemplates without importing the Asana SDK', async () => {
		const gateway = createPaginatingProjectTemplateGateway()
		const api = createProjectTemplateApi(gateway, { jobs: { getJob: vi.fn() } })

		const result = await api.listProjectTemplates({ workspace: workspaceGid }, { limit: 25 })

		expect(result).toEqual({
			data: pages[0],
			next_page: { offset: 'page2' },
			limit: 25,
		})
		expect(gateway.listProjectTemplates).toHaveBeenCalledWith({ workspace: workspaceGid }, { limit: 25 })
	})
})
