import { expect, it } from 'vitest'
import type { SearchApi } from './api.js'
import type { TypeaheadResourceType } from './gateway.js'

export type TypeaheadAcceptanceDeps = {
	getApi: () => Pick<SearchApi, 'searchObjects'>
	workspaceGid: string
	/** Defaults to `project`, the type most likely to exist in any workspace. */
	resourceType?: TypeaheadResourceType
}

/**
 * The contract typeahead has to honour on both a double and the live API: a single flat
 * page of gid-bearing hits, capped by `count`, with no pagination envelope.
 */
export function defineTypeaheadAcceptanceSpecs(deps: TypeaheadAcceptanceDeps) {
	const resourceType = deps.resourceType ?? 'project'

	return () => {
		it('returns a flat array, not a paginated envelope', async () => {
			const result = await deps.getApi().searchObjects(deps.workspaceGid, resourceType)

			expect(Array.isArray(result)).toBe(true)
			expect(result).not.toHaveProperty('next_page')
		})

		it('gives every hit a gid, so a name can be handed to the GID-taking tools', async () => {
			const result = await deps.getApi().searchObjects(deps.workspaceGid, resourceType, { optFields: 'gid,name' })

			for (const hit of result) {
				expect(typeof hit.gid).toBe('string')
			}
		})

		it('caps the result set at count', async () => {
			const result = await deps.getApi().searchObjects(deps.workspaceGid, resourceType, { count: 1 })

			expect(result.length).toBeLessThanOrEqual(1)
		})

		it('still returns results when the query is omitted', async () => {
			const result = await deps.getApi().searchObjects(deps.workspaceGid, resourceType, { count: 5 })

			expect(Array.isArray(result)).toBe(true)
			expect(result.length).toBeLessThanOrEqual(5)
		})
	}
}
