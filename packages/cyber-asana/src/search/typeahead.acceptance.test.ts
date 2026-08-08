import { describe, expect, it, vi } from 'vitest'
import { createSearchApi } from './api.js'
import type { SearchGateway } from './gateway.js'
import { defineTypeaheadAcceptanceSpecs } from './typeahead.acceptance.js'

const workspaceGid = 'ws-test'
const projects = [
	{ gid: 'proj1', name: 'Website Redesign', resource_type: 'project' },
	{ gid: 'proj2', name: 'Website Copy', resource_type: 'project' },
	{ gid: 'proj3', name: 'Mobile App', resource_type: 'project' },
]

/** Mimics the endpoint: one flat page, substring match, capped by count (Asana default 20). */
function createTypeaheadSearchGateway(): SearchGateway {
	return {
		searchObjects: vi.fn(
			async (_workspaceGid: string, _resourceType: string, opts?: { query?: string; count?: number }) => {
				const query = opts?.query?.toLowerCase()
				const matched = query ? projects.filter((p) => p.name.toLowerCase().includes(query)) : projects
				return matched.slice(0, opts?.count ?? 20)
			},
		),
	}
}

describe(
	'search/typeahead acceptance',
	defineTypeaheadAcceptanceSpecs({
		getApi: () => createSearchApi(createTypeaheadSearchGateway()),
		workspaceGid,
	}),
)

describe('search/typeahead acceptance gateway double', () => {
	it('exercises searchObjects without importing the Asana SDK', async () => {
		const gateway = createTypeaheadSearchGateway()
		const api = createSearchApi(gateway)

		const result = await api.searchObjects(workspaceGid, 'project', { query: 'website', count: 2 })

		expect(result).toEqual([projects[0], projects[1]])
		expect(gateway.searchObjects).toHaveBeenCalledWith(workspaceGid, 'project', { query: 'website', count: 2 })
	})
})
