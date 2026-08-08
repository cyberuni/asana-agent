import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { deleteIdempotently } from '../idempotent-delete.js'
import { paginationOptions, paginationParams } from '../mcp-options.js'
import type { StoryApi } from './api.js'
import {
	createStory,
	deleteStory,
	getStory,
	getTaskTemplateData,
	interpolateTemplate,
	listStories,
	updateStory,
} from './api.js'

function resolveStoryApi(api?: StoryApi | (() => StoryApi)): StoryApi {
	if (typeof api === 'function') return api()
	return api ?? { listStories, createStory, getStory, updateStory, deleteStory, getTaskTemplateData }
}

const EDITABLE_STORY_NOTE =
	'Only comment stories you authored can be changed; system stories (assignee changed, due date set) are immutable.'

function registerStoryToolsWithPrefix(
	server: McpServer,
	prefix: 'story' | 'comment',
	api?: StoryApi | (() => StoryApi),
) {
	server.tool(
		`asana_${prefix}_list`,
		'List Asana stories (comments) for a task',
		{ task_gid: z.string().describe('Task GID'), ...paginationParams },
		async ({ task_gid, ...params }) => ({
			content: [
				{
					type: 'text',
					text: JSON.stringify(await resolveStoryApi(api).listStories(task_gid, paginationOptions(params))),
				},
			],
		}),
	)

	server.tool(
		`asana_${prefix}_create`,
		'Add a comment to an Asana task',
		{
			task_gid: z.string().describe('Task GID'),
			text: z
				.string()
				.optional()
				.describe(
					'Comment text. When template=true, supports {task.name}, {task.assignee}, {task.due_on}, {task.notes}',
				),
			html_text: z
				.string()
				.optional()
				.describe(
					'Comment rich text as Asana HTML. When template=true, supports {task.name}, {task.assignee}, {task.due_on}, {task.notes}',
				),
			template: z
				.boolean()
				.optional()
				.describe('Treat text as a template and interpolate task variables before posting'),
		},
		async ({ task_gid, text, html_text, template }) => {
			const task = template ? await resolveStoryApi(api).getTaskTemplateData(task_gid) : undefined
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							await resolveStoryApi(api).createStory(task_gid, {
								...(text !== undefined && { text: task ? interpolateTemplate(text, task) : text }),
								...(html_text !== undefined && {
									html_text: task ? interpolateTemplate(html_text, task) : html_text,
								}),
							}),
						),
					},
				],
			}
		},
	)

	server.tool(
		`asana_${prefix}_get`,
		'Get an Asana story (comment) by GID',
		{ story_gid: z.string().describe('Story GID') },
		async ({ story_gid }) => ({
			content: [{ type: 'text', text: JSON.stringify(await resolveStoryApi(api).getStory(story_gid)) }],
		}),
	)

	server.tool(
		`asana_${prefix}_update`,
		`Edit the text of an Asana comment. ${EDITABLE_STORY_NOTE}`,
		{
			story_gid: z.string().describe('Story GID'),
			text: z.string().optional().describe('Replacement comment text'),
			html_text: z.string().optional().describe('Replacement comment rich text as Asana HTML'),
		},
		async ({ story_gid, text, html_text }) => ({
			content: [
				{
					type: 'text',
					text: JSON.stringify(
						await resolveStoryApi(api).updateStory(story_gid, {
							...(text !== undefined && { text }),
							...(html_text !== undefined && { html_text }),
						}),
					),
				},
			],
		}),
	)

	server.tool(
		`asana_${prefix}_delete`,
		`Delete an Asana comment. ${EDITABLE_STORY_NOTE}`,
		{ story_gid: z.string().describe('Story GID') },
		async ({ story_gid }) => {
			const result = await deleteIdempotently('story', story_gid, () => resolveStoryApi(api).deleteStory(story_gid))
			return { content: [{ type: 'text', text: JSON.stringify(result) }] }
		},
	)
}

export function registerStoryTools(server: McpServer, api?: StoryApi | (() => StoryApi)) {
	registerStoryToolsWithPrefix(server, 'story', api)
	registerStoryToolsWithPrefix(server, 'comment', api)
}
