import type { CreateGoalFields, UpdateGoalFields } from './api.js'

type BuildGoalWriteInput = {
	notes?: string
	dueOn?: string
	startOn?: string
}

type BuildGoalCreateInput = BuildGoalWriteInput

type BuildGoalUpdateInput = BuildGoalWriteInput & {
	name?: string
	clearDueOn?: boolean
	clearStartOn?: boolean
}

export function buildGoalCreateFields(input: BuildGoalCreateInput): CreateGoalFields {
	return {
		...(input.notes !== undefined && { notes: input.notes }),
		...(input.dueOn !== undefined && { due_on: input.dueOn }),
		...(input.startOn !== undefined && { start_on: input.startOn }),
	}
}

export function buildGoalUpdateFields(input: BuildGoalUpdateInput): UpdateGoalFields {
	if (input.dueOn !== undefined && input.clearDueOn) {
		throw new Error('--due-on and --clear-due-on are mutually exclusive')
	}
	if (input.startOn !== undefined && input.clearStartOn) {
		throw new Error('--start-on and --clear-start-on are mutually exclusive')
	}
	return {
		...(input.name !== undefined && { name: input.name }),
		...(input.notes !== undefined && { notes: input.notes }),
		...(input.dueOn !== undefined && { due_on: input.dueOn }),
		...(input.clearDueOn !== undefined && { due_on: input.clearDueOn ? null : input.dueOn }),
		...(input.startOn !== undefined && { start_on: input.startOn }),
		...(input.clearStartOn !== undefined && { start_on: input.clearStartOn ? null : input.startOn }),
	}
}
