import { Command } from 'commander'
import { addPaginationOptions, itemsForOutput, paginationOptionsFromCli, printNextPageHint } from '../cli-options.js'
import { output, printCountSummary, printFields, printNextSteps, printTable } from '../output.js'
import type { WorkspaceApi } from './api.js'
import { getWorkspace, listWorkspaces } from './api.js'

type Workspace = { gid: string; name: string }

function resolveWorkspaceApi(api?: WorkspaceApi | (() => WorkspaceApi)): WorkspaceApi {
	if (typeof api === 'function') return api()
	return (
		api ?? {
			listWorkspaces,
			getWorkspace,
		}
	)
}

// Minimal default schema for workspace lists — principle 2.
const WORKSPACE_LIST_FIELDS = 'gid,name'

export function workspaceCommand(api?: WorkspaceApi | (() => WorkspaceApi)) {
	const cmd = new Command('workspace').description('Manage Asana workspaces')

	addPaginationOptions(cmd.command('list').description('List all workspaces')).action(
		async (opts: { limit?: number; offset?: string; optFields?: string }) => {
			const pagination = paginationOptionsFromCli(opts)
			pagination.optFields ??= WORKSPACE_LIST_FIELDS
			const data = await resolveWorkspaceApi(api).listWorkspaces(pagination)
			output(data, () => {
				const items = itemsForOutput(data)
				printTable(items, [
					{ label: 'Name', get: (w: Workspace) => w.name },
					{ label: 'ID', get: (w: Workspace) => w.gid },
				])
				printCountSummary(items.length, 'workspace(s)')
				printNextPageHint(data)
				printNextSteps(['cyber-asana project list --workspace-gid <gid> — list a workspace’s projects'])
			})
		},
	)

	cmd
		.command('get <gid>')
		.description('Get a workspace by GID')
		.action(async (gid: string) => {
			const data = await resolveWorkspaceApi(api).getWorkspace(gid)
			output(data, () => printFields({ Name: (data as Workspace).name, ID: (data as Workspace).gid }))
		})

	return cmd
}
