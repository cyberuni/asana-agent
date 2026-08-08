import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { deleteIdempotently } from '../idempotent-delete.js'
import { paginationOptions, paginationParams } from '../mcp-options.js'
import type { AttachmentApi } from './api.js'
import { createAttachment, deleteAttachment, getAttachment, listAttachments } from './api.js'

function resolveAttachmentApi(api?: AttachmentApi | (() => AttachmentApi)): AttachmentApi {
	if (typeof api === 'function') return api()
	return (
		api ?? {
			listAttachments,
			getAttachment,
			createAttachment,
			deleteAttachment,
		}
	)
}

export function registerAttachmentTools(server: McpServer, api?: AttachmentApi | (() => AttachmentApi)) {
	server.tool(
		'asana_attachment_list',
		'List Asana attachments for a task',
		{ task_gid: z.string().describe('Task GID'), ...paginationParams },
		async ({ task_gid, ...params }) => ({
			content: [
				{
					type: 'text',
					text: JSON.stringify(await resolveAttachmentApi(api).listAttachments(task_gid, paginationOptions(params))),
				},
			],
		}),
	)

	server.tool(
		'asana_attachment_get',
		'Get an Asana attachment by GID',
		{ attachment_gid: z.string().describe('Attachment GID') },
		async ({ attachment_gid }) => ({
			content: [{ type: 'text', text: JSON.stringify(await resolveAttachmentApi(api).getAttachment(attachment_gid)) }],
		}),
	)

	server.tool(
		'asana_attachment_create',
		'Attach a file or an external URL to an Asana task, project, or project brief. Provide exactly one of file or url. A file path is read from the filesystem of the machine running the MCP server, not the caller’s machine.',
		{
			parent_gid: z.string().describe('Parent GID — a task, project, or project brief'),
			file: z.string().optional().describe('Path to a local file, resolved on the machine running the MCP server'),
			url: z.string().optional().describe('External URL to attach instead of a file'),
			name: z.string().optional().describe('Attachment name (default: the file basename, or the URL)'),
		},
		async ({ parent_gid, file, url, name }) => ({
			content: [
				{
					type: 'text',
					text: JSON.stringify(await resolveAttachmentApi(api).createAttachment(parent_gid, { file, url, name })),
				},
			],
		}),
	)

	server.tool(
		'asana_attachment_delete',
		'Delete an Asana attachment by GID',
		{ attachment_gid: z.string().describe('Attachment GID') },
		async ({ attachment_gid }) => ({
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						await deleteIdempotently('attachment', attachment_gid, () =>
							resolveAttachmentApi(api).deleteAttachment(attachment_gid),
						),
					),
				},
			],
		}),
	)
}
