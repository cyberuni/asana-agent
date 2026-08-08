import Asana from 'asana'
import {
	collectListResponse,
	type ListResult,
	type PaginationOptions,
	toAsanaPaginationOptions,
} from '../pagination.js'

export type CustomFieldGateway = {
	listCustomFields(workspaceGid: string, opts?: PaginationOptions): Promise<ListResult<any>>
	getCustomField(customFieldGid: string): Promise<any>
}

export function createAsanaCustomFieldGateway(client: Asana.ApiClient): CustomFieldGateway {
	const customFieldsApi = new Asana.CustomFieldsApi(client)

	return {
		async listCustomFields(workspaceGid, opts) {
			const res = await customFieldsApi.getCustomFieldsForWorkspace(workspaceGid, toAsanaPaginationOptions(opts))
			return await collectListResponse(res, opts)
		},
		async getCustomField(customFieldGid) {
			const res = await customFieldsApi.getCustomField(customFieldGid, {})
			return res.data
		},
	}
}
