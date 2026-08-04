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
import type { GoalApi } from './api.js'
import { createGoal, deleteGoal, getGoal, listGoals, updateGoal } from './api.js'

type Goal = { gid: string; name: string; permalink_url?: string; due_on?: string | null; status?: string | null }

function fmtGoal(g: Goal) {
	printFields({
		Name: g.name,
		ID: g.gid,
		URL: g.permalink_url ?? null,
		Due: g.due_on ?? null,
		Status: g.status ?? null,
	})
}

function resolveGoalApi(api?: GoalApi | (() => GoalApi)): GoalApi {
	if (typeof api === 'function') return api()
	return (
		api ?? {
			listGoals,
			getGoal,
			createGoal,
			updateGoal,
			deleteGoal,
		}
	)
}

// Minimal default schema for goal lists — principle 2.
const GOAL_LIST_FIELDS = 'gid,name,due_on'

const GOAL_LIST_NEXT_STEPS = [
	'cyber-asana goal get <gid> — view a goal',
	'cyber-asana status list --parent-gid <gid> — status updates on a goal',
]

export function goalCommand(api?: GoalApi | (() => GoalApi)) {
	const cmd = new Command('goal').description('Manage Asana goals')

	addPaginationOptions(
		addGidOption(cmd.command('list').description('List goals in a workspace'), 'workspace', 'Workspace GID', {
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
			pagination.optFields ??= GOAL_LIST_FIELDS
			const data = await resolveGoalApi(api).listGoals(requiredGid(opts, 'workspace', 'Workspace GID'), pagination)
			output(data, () => {
				const items = itemsForOutput(data)
				printTable(items, [
					{ label: 'Name', get: (g: Goal) => g.name },
					{ label: 'ID', get: (g: Goal) => g.gid },
					{ label: 'Due', get: (g: Goal) => g.due_on ?? '' },
				])
				printCountSummary(items.length, 'goal(s)')
				printNextPageHint(data)
				printNextSteps(GOAL_LIST_NEXT_STEPS)
			})
		},
	)

	cmd
		.command('get <gid>')
		.description('Get a goal by GID')
		.action(async (gid: string) => {
			const data = await resolveGoalApi(api).getGoal(gid)
			output(data, () => fmtGoal(data))
		})

	const createCmd = addGidOption(
		cmd.command('create <name>').description('Create a goal'),
		'workspace',
		'Workspace GID',
		{
			env: 'ASANA_WORKSPACE',
		},
	)
	createCmd
		.option('--notes <text>', 'Goal notes')
		.option('--due-on <date>', 'Due date (YYYY-MM-DD)')
		.action(
			async (name: string, opts: { workspace?: string; workspaceGid?: string; notes?: string; dueOn?: string }) => {
				const data = await resolveGoalApi(api).createGoal(requiredGid(opts, 'workspace', 'Workspace GID'), name, {
					notes: opts.notes,
					due_on: opts.dueOn,
				})
				output(data, () => fmtGoal(data))
			},
		)

	cmd
		.command('update <gid>')
		.description('Update a goal')
		.option('--name <name>', 'New name')
		.option('--notes <text>', 'New notes')
		.option('--due-on <date>', 'Due date (YYYY-MM-DD)')
		.action(async (gid: string, opts: { name?: string; notes?: string; dueOn?: string }) => {
			const data = await resolveGoalApi(api).updateGoal(gid, { name: opts.name, notes: opts.notes, due_on: opts.dueOn })
			output(data, () => fmtGoal(data))
		})

	cmd
		.command('delete <gid>')
		.description('Delete a goal')
		.action(async (gid: string) => {
			await resolveGoalApi(api).deleteGoal(gid)
			output({ deleted: true, resource: 'goal', gid }, () => console.log(`Deleted goal ${gid}`))
		})

	return cmd
}
