import { describe, expect, it } from 'vitest'
import { buildGoalCreateFields, buildGoalUpdateFields } from './write-options.js'

describe('goals/write-options', () => {
	it('buildGoalCreateFields carries a start date alongside a due date', () => {
		expect(buildGoalCreateFields({ dueOn: '2026-12-31', startOn: '2026-01-01' })).toEqual({
			due_on: '2026-12-31',
			start_on: '2026-01-01',
		})
	})

	it('buildGoalCreateFields omits the dates it was not given', () => {
		expect(buildGoalCreateFields({ notes: 'Q2 target' })).toEqual({ notes: 'Q2 target' })
	})

	it('buildGoalUpdateFields carries a start date', () => {
		expect(buildGoalUpdateFields({ startOn: '2026-01-01' })).toEqual({ start_on: '2026-01-01' })
	})

	it('buildGoalUpdateFields sends null for a cleared start date', () => {
		expect(buildGoalUpdateFields({ clearStartOn: true })).toEqual({ start_on: null })
	})

	it('buildGoalUpdateFields sends null for a cleared due date', () => {
		expect(buildGoalUpdateFields({ clearDueOn: true })).toEqual({ due_on: null })
	})

	it('buildGoalUpdateFields rejects a start date set and cleared at once', () => {
		expect(() => buildGoalUpdateFields({ startOn: '2026-01-01', clearStartOn: true })).toThrow(
			'--start-on and --clear-start-on are mutually exclusive',
		)
	})

	it('buildGoalUpdateFields rejects a due date set and cleared at once', () => {
		expect(() => buildGoalUpdateFields({ dueOn: '2026-12-31', clearDueOn: true })).toThrow(
			'--due-on and --clear-due-on are mutually exclusive',
		)
	})

	it('buildGoalUpdateFields omits every field it was not given', () => {
		expect(buildGoalUpdateFields({})).toEqual({})
	})
})
