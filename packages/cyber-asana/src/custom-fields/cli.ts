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
import { isFull, truncate } from '../truncate.js'
import type { CustomFieldApi } from './api.js'
import { getCustomField, listCustomFields } from './api.js'

type EnumOption = { gid: string; name: string; enabled?: boolean }
type CustomField = {
	gid: string
	name: string
	resource_subtype?: string
	description?: string
	enum_options?: EnumOption[]
}

function resolveCustomFieldApi(api?: CustomFieldApi | (() => CustomFieldApi)): CustomFieldApi {
	if (typeof api === 'function') return api()
	return (
		api ?? {
			listCustomFields,
			getCustomField,
		}
	)
}

// Minimal default schema for custom field lists — principle 2. `resource_subtype` is
// included because it tells the caller whether a value is text, number, or an enum GID.
const CUSTOM_FIELD_LIST_FIELDS = 'gid,name,resource_subtype'

export function customFieldCommand(api?: CustomFieldApi | (() => CustomFieldApi)) {
	const cmd = new Command('custom-field').description('Discover Asana custom fields and their enum options')

	cmd.addHelpText(
		'after',
		[
			'',
			'Examples:',
			'  cyber-asana custom-field list --workspace-gid <gid>',
			'  cyber-asana custom-field get <gid> --toon',
			'',
			'The GIDs printed here are what `task create` / `task update` expect in',
			'--custom-field <gid=value> and --custom-fields-json.',
			'',
			'Every subcommand supports --help for its own options.',
		].join('\n'),
	)

	addPaginationOptions(
		addGidOption(cmd.command('list').description('List custom fields in a workspace'), 'workspace', 'Workspace GID', {
			env: 'ASANA_WORKSPACE',
		}),
	).action(
		async (opts: {
			workspace?: string
			workspaceGid?: string
			limit?: number
			offset?: string
			optFields?: string
		}) => {
			const pagination = paginationOptionsFromCli(opts)
			pagination.optFields ??= CUSTOM_FIELD_LIST_FIELDS
			const data = await resolveCustomFieldApi(api).listCustomFields(
				requiredGid(opts, 'workspace', 'Workspace GID'),
				pagination,
			)
			output(data, () => {
				const items = itemsForOutput(data)
				printTable(
					items,
					[
						{ label: 'Name', get: (f: CustomField) => f.name },
						{ label: 'Type', get: (f: CustomField) => f.resource_subtype ?? '' },
						{ label: 'ID', get: (f: CustomField) => f.gid },
					],
					{ entity: 'custom fields' },
				)
				printCountSummary(items.length, 'custom field(s)')
				printNextPageHint(data)
				printNextSteps(['cyber-asana custom-field get <gid> — view a field and its enum options'])
			})
		},
	)

	cmd
		.command('get <gid>')
		.description('Get a custom field by GID, including its enum options')
		.action(async (gid: string) => {
			const data = (await resolveCustomFieldApi(api).getCustomField(gid)) as CustomField
			output(data, () => {
				printFields({
					Name: data.name,
					ID: data.gid,
					Type: data.resource_subtype,
					Description: truncate(data.description, { full: isFull() }),
				})
				printTable(
					data.enum_options ?? [],
					[
						{ label: 'Option', get: (o: EnumOption) => o.name },
						{ label: 'ID', get: (o: EnumOption) => o.gid },
						{ label: 'Enabled', get: (o: EnumOption) => (o.enabled === false ? 'no' : 'yes') },
					],
					{ entity: 'enum options' },
				)
			})
		})

	return cmd
}
