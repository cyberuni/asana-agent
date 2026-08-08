import { describe, expect, it, vi } from 'vitest'
import { createSearchApi, TYPEAHEAD_RESOURCE_TYPES } from './api.js'

const mockProject = { gid: 'proj1', name: 'Website Redesign', resource_type: 'project' }

describe('createSearchApi', () => {
	it('uses the provided gateway for searchObjects', async () => {
		const searchObjects = vi.fn().mockResolvedValue([mockProject])
		const api = createSearchApi({ searchObjects })

		const result = await api.searchObjects('ws1', 'project', { query: 'website' })

		expect(result).toEqual([mockProject])
		expect(searchObjects).toHaveBeenCalledWith('ws1', 'project', { query: 'website' })
	})

	it('forwards a call with no options', async () => {
		const searchObjects = vi.fn().mockResolvedValue([])
		const api = createSearchApi({ searchObjects })

		await api.searchObjects('ws1', 'user')

		expect(searchObjects).toHaveBeenCalledWith('ws1', 'user', undefined)
	})
})

describe('TYPEAHEAD_RESOURCE_TYPES', () => {
	it('lists every resource type the typeahead endpoint accepts', () => {
		expect([...TYPEAHEAD_RESOURCE_TYPES]).toEqual([
			'actor',
			'agent',
			'custom_field',
			'goal',
			'portfolio',
			'project',
			'project_template',
			'tag',
			'task',
			'team',
			'user',
		])
	})
})
