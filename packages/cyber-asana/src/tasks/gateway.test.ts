import Asana from 'asana'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createAsanaTaskGateway } from './gateway.js'

type BatchAction = { method: string; relative_path: string; options?: { fields?: string[] } }

function batchActionsOf(call: unknown): BatchAction[] {
	return (call as { data: { actions: BatchAction[] } }).data.actions
}

function stubBatchRequest(gids: string[]) {
	return vi.spyOn(Asana.BatchAPIApi.prototype, 'createBatchRequest').mockResolvedValue({
		data: gids.map((gid) => ({ status_code: 200, body: { data: { gid } } })),
	} as never)
}

describe('tasks/gateway batch lookup', () => {
	afterEach(() => vi.restoreAllMocks())

	it('sends opt_fields as batch action output options, not as a relative_path query string', async () => {
		const batchSpy = stubBatchRequest(['456'])
		const gateway = createAsanaTaskGateway({} as Asana.ApiClient)

		await gateway.getTasksByGid(['456'], { optFields: 'gid,name,completed' })

		expect(batchActionsOf(batchSpy.mock.calls[0][0])).toEqual([
			{ method: 'get', relative_path: '/tasks/456', options: { fields: ['gid', 'name', 'completed'] } },
		])
	})

	it('keeps every relative_path free of query parameters across multiple gids', async () => {
		const batchSpy = stubBatchRequest(['456', '789'])
		const gateway = createAsanaTaskGateway({} as Asana.ApiClient)

		await gateway.getTasksByGid(['456', '789'], { optFields: 'gid,name' })

		const actions = batchActionsOf(batchSpy.mock.calls[0][0])
		expect(actions.map((action) => action.relative_path)).toEqual(['/tasks/456', '/tasks/789'])
		for (const action of actions) {
			expect(action.relative_path).not.toContain('?')
		}
	})

	it('omits output options when no opt_fields are requested', async () => {
		const batchSpy = stubBatchRequest(['456'])
		const gateway = createAsanaTaskGateway({} as Asana.ApiClient)

		await gateway.getTasksByGid(['456'])

		expect(batchActionsOf(batchSpy.mock.calls[0][0])).toEqual([{ method: 'get', relative_path: '/tasks/456' }])
	})
})
