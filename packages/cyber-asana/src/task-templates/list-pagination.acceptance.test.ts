import { describe, expect, it, vi } from 'vitest'
import { createPaginatingScopedListMock } from '../testing/paginating-gateway.js'
import { createTaskTemplateApi } from './api.js'
import type { TaskTemplateGateway } from './gateway.js'
import { defineTaskTemplateListPaginationAcceptanceSpecs } from './list-pagination.acceptance.js'

const projectGid = 'proj-test'
const pages = [
	[{ gid: 'tt1', name: 'Release checklist' }],
	[{ gid: 'tt2', name: 'Incident postmortem' }],
	[{ gid: 'tt3', name: 'Code review ritual' }],
]

function createPaginatingTaskTemplateGateway(): TaskTemplateGateway {
	return {
		listTaskTemplates: createPaginatingScopedListMock(pages),
		getTaskTemplate: vi.fn(),
		instantiateTask: vi.fn(),
		getJob: vi.fn(),
	}
}

describe(
	'task-templates/list pagination acceptance',
	defineTaskTemplateListPaginationAcceptanceSpecs({
		getApi: () => createTaskTemplateApi(createPaginatingTaskTemplateGateway()),
		projectGid,
	}),
)

describe('task-templates/list pagination acceptance gateway double', () => {
	it('exercises listTaskTemplates without importing the Asana SDK', async () => {
		const gateway = createPaginatingTaskTemplateGateway()
		const api = createTaskTemplateApi(gateway)

		const result = await api.listTaskTemplates(projectGid, { limit: 25 })

		expect(result).toEqual({
			data: [{ gid: 'tt1', name: 'Release checklist' }],
			next_page: { offset: 'page2' },
			limit: 25,
		})
		expect(gateway.listTaskTemplates).toHaveBeenCalledWith(projectGid, { limit: 25 })
	})
})
