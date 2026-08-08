import { createClient } from '../client.js'
import type { PaginationOptions } from '../pagination.js'
import { type CustomFieldGateway, createAsanaCustomFieldGateway } from './gateway.js'

export type CustomFieldApi = ReturnType<typeof createCustomFieldApi>

export function createCustomFieldApi(gateway: CustomFieldGateway) {
	return {
		listCustomFields(workspaceGid: string, opts?: PaginationOptions) {
			return gateway.listCustomFields(workspaceGid, opts)
		},
		getCustomField(customFieldGid: string) {
			return gateway.getCustomField(customFieldGid)
		},
	}
}

function defaultCustomFieldApi() {
	return createCustomFieldApi(createAsanaCustomFieldGateway(createClient()))
}

export async function listCustomFields(workspaceGid: string, opts?: PaginationOptions) {
	return defaultCustomFieldApi().listCustomFields(workspaceGid, opts)
}

export async function getCustomField(customFieldGid: string) {
	return defaultCustomFieldApi().getCustomField(customFieldGid)
}
