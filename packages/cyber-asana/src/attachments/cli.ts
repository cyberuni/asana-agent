import { Command } from 'commander'
import {
	addGidOption,
	addPaginationOptions,
	itemsForOutput,
	paginationOptionsFromCli,
	printNextPageHint,
	requiredGid,
} from '../cli-options.js'
import { output, printCountSummary, printFields, printNextSteps, printTable } from '../output.js'
import type { AttachmentApi } from './api.js'
import { getAttachment, listAttachments } from './api.js'

type Attachment = { gid: string; name: string; resource_type?: string; download_url?: string | null }

function resolveAttachmentApi(api?: AttachmentApi | (() => AttachmentApi)): AttachmentApi {
	if (typeof api === 'function') return api()
	return (
		api ?? {
			listAttachments,
			getAttachment,
		}
	)
}

// Minimal default schema for attachment lists — principle 2. The download URL
// is signed and long, so a list omits it; `attachment get <gid>` returns it.
const ATTACHMENT_LIST_FIELDS = 'gid,name,resource_type'

export function attachmentCommand(api?: AttachmentApi | (() => AttachmentApi)) {
	const cmd = new Command('attachment').description('Manage Asana attachments')

	addPaginationOptions(
		addGidOption(cmd.command('list').description('List attachments for a task'), 'task', 'Task GID'),
	).action(async (opts: { task?: string; taskGid?: string; limit?: number; offset?: string; optFields?: string }) => {
		const pagination = paginationOptionsFromCli(opts)
		pagination.optFields ??= ATTACHMENT_LIST_FIELDS
		const data = await resolveAttachmentApi(api).listAttachments(requiredGid(opts, 'task', 'Task GID'), pagination)
		output(data, () => {
			const items = itemsForOutput(data)
			printTable(
				items,
				[
					{ label: 'Name', get: (a: Attachment) => a.name },
					{ label: 'ID', get: (a: Attachment) => a.gid },
				],
				{ entity: 'attachments' },
			)
			printCountSummary(items.length, 'attachment(s)')
			printNextPageHint(data)
			printNextSteps(['cyber-asana attachment get <gid> — view an attachment and its download URL'])
		})
	})

	cmd
		.command('get <gid>')
		.description('Get an attachment by GID')
		.action(async (gid: string) => {
			const data = await resolveAttachmentApi(api).getAttachment(gid)
			output(data, () =>
				printFields({
					Name: (data as Attachment).name,
					ID: (data as Attachment).gid,
					URL: (data as Attachment).download_url ?? null,
				}),
			)
		})

	return cmd
}
