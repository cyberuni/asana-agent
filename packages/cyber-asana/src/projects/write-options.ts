type BuildProjectWriteInput = {
	archived?: boolean
	owner?: string
	notes?: string
	htmlNotes?: string
	color?: string
	privacySetting?: 'public_to_workspace' | 'private' | 'private_to_team'
	defaultView?: 'list' | 'board' | 'calendar' | 'timeline'
	dueOn?: string
	startOn?: string
}

type BuildProjectUpdateInput = BuildProjectWriteInput & {
	clearOwner?: boolean
	clearDueOn?: boolean
	clearStartOn?: boolean
}

type ProjectCreateFields = {
	archived?: boolean
	owner?: string
	notes?: string
	html_notes?: string
	color?: string
	privacy_setting?: 'public_to_workspace' | 'private' | 'private_to_team'
	default_view?: 'list' | 'board' | 'calendar' | 'timeline'
	due_on?: string
	start_on?: string
}

type ProjectUpdateFields = {
	archived?: boolean
	owner?: string | null
	notes?: string
	html_notes?: string
	color?: string
	privacy_setting?: 'public_to_workspace' | 'private' | 'private_to_team'
	default_view?: 'list' | 'board' | 'calendar' | 'timeline'
	due_on?: string | null
	start_on?: string | null
}

function assertNotesMode(notes?: string, htmlNotes?: string) {
	if (notes !== undefined && htmlNotes !== undefined) {
		throw new Error('--notes and --html-notes are mutually exclusive')
	}
}

function assertProjectDateMode(input: {
	dueOn?: string
	startOn?: string
	clearDueOn?: boolean
	clearStartOn?: boolean
}) {
	if (input.dueOn !== undefined && input.clearDueOn) {
		throw new Error('--due-on and --clear-due-on are mutually exclusive')
	}
	if (input.startOn !== undefined && input.clearStartOn) {
		throw new Error('--start-on and --clear-start-on are mutually exclusive')
	}
	if ((input.startOn !== undefined || input.clearStartOn) && input.dueOn === undefined) {
		throw new Error(`${input.clearStartOn ? '--clear-start-on' : '--start-on'} requires --due-on`)
	}
	if (input.startOn !== undefined && input.dueOn !== undefined && input.startOn === input.dueOn) {
		throw new Error('--start-on and --due-on cannot be the same date')
	}
}

function assertOwnerMode(input: { owner?: string; clearOwner?: boolean }) {
	if (input.owner !== undefined && input.clearOwner) {
		throw new Error('--owner and --clear-owner are mutually exclusive')
	}
}

export function buildProjectCreateFields(input: BuildProjectWriteInput): ProjectCreateFields {
	assertNotesMode(input.notes, input.htmlNotes)
	assertProjectDateMode(input)
	return {
		...(input.archived !== undefined && { archived: input.archived }),
		...(input.owner !== undefined && { owner: input.owner }),
		...(input.notes !== undefined && { notes: input.notes }),
		...(input.htmlNotes !== undefined && { html_notes: input.htmlNotes }),
		...(input.color !== undefined && { color: input.color }),
		...(input.privacySetting !== undefined && { privacy_setting: input.privacySetting }),
		...(input.defaultView !== undefined && { default_view: input.defaultView }),
		...(input.dueOn !== undefined && { due_on: input.dueOn }),
		...(input.startOn !== undefined && { start_on: input.startOn }),
	}
}

export function buildProjectUpdateFields(input: BuildProjectUpdateInput): ProjectUpdateFields {
	assertNotesMode(input.notes, input.htmlNotes)
	assertProjectDateMode(input)
	assertOwnerMode(input)
	return {
		...(input.archived !== undefined && { archived: input.archived }),
		...(input.owner !== undefined && { owner: input.owner }),
		...(input.clearOwner !== undefined && { owner: input.clearOwner ? null : input.owner }),
		...(input.notes !== undefined && { notes: input.notes }),
		...(input.htmlNotes !== undefined && { html_notes: input.htmlNotes }),
		...(input.color !== undefined && { color: input.color }),
		...(input.privacySetting !== undefined && { privacy_setting: input.privacySetting }),
		...(input.defaultView !== undefined && { default_view: input.defaultView }),
		...(input.dueOn !== undefined && { due_on: input.dueOn }),
		...(input.clearDueOn !== undefined && { due_on: input.clearDueOn ? null : input.dueOn }),
		...(input.startOn !== undefined && { start_on: input.startOn }),
		...(input.clearStartOn !== undefined && { start_on: input.clearStartOn ? null : input.startOn }),
	}
}
