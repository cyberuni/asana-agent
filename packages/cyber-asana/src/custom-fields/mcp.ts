import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { paginationOptions, paginationParams } from '../mcp-options.js'
import type { CustomFieldApi } from './api.js'
import { getCustomField, listCustomFields } from './api.js'

function resolveCustomFieldApi(api?: CustomFieldApi | (() => CustomFieldApi)): CustomFieldApi {
	if (typeof api === 'function') return api()
	return (
		api ?? {
			listCustomFields,
			getCustomField,
		}
	)
}

export function registerCustomFieldTools(server: McpServer, api?: CustomFieldApi | (() => CustomFieldApi)) {
	server.tool(
		'asana_custom_field_list',
		"List a workspace's custom fields — use this to find the field GIDs that asana_task_create and asana_task_update expect in custom_fields",
		{ workspace_gid: z.string().describe('Workspace GID'), ...paginationParams },
		async ({ workspace_gid, ...params }) => ({
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						await resolveCustomFieldApi(api).listCustomFields(workspace_gid, paginationOptions(params)),
					),
				},
			],
		}),
	)

	server.tool(
		'asana_custom_field_get',
		'Get an Asana custom field by GID, including its enum options and their GIDs',
		{ custom_field_gid: z.string().describe('Custom field GID') },
		async ({ custom_field_gid }) => ({
			content: [
				{ type: 'text', text: JSON.stringify(await resolveCustomFieldApi(api).getCustomField(custom_field_gid)) },
			],
		}),
	)
}
