import { describe, expect, it } from 'vitest'
import { buildProjectCreateFields, buildProjectUpdateFields } from './write-options.js'

describe('projects/write-options', () => {
	it('buildProjectCreateFields rejects notes and html_notes together', () => {
		expect(() =>
			buildProjectCreateFields({
				notes: 'plain',
				htmlNotes: '<body>html</body>',
			}),
		).toThrow('--notes and --html-notes are mutually exclusive')
	})

	it('buildProjectCreateFields requires due_on when start_on is set', () => {
		expect(() =>
			buildProjectCreateFields({
				startOn: '2026-06-01',
			}),
		).toThrow('--start-on requires --due-on')
	})

	it('buildProjectUpdateFields rejects due_on and clear_due_on together', () => {
		expect(() =>
			buildProjectUpdateFields({
				dueOn: '2026-06-02',
				clearDueOn: true,
			}),
		).toThrow('--due-on and --clear-due-on are mutually exclusive')
	})

	it('buildProjectUpdateFields requires due_on when clearing start_on', () => {
		expect(() =>
			buildProjectUpdateFields({
				clearStartOn: true,
			}),
		).toThrow('--clear-start-on requires --due-on')
	})

	it('buildProjectUpdateFields maps clear flags and richer fields', () => {
		expect(
			buildProjectUpdateFields({
				htmlNotes: '<body>Updated</body>',
				privacySetting: 'private',
				defaultView: 'board',
				dueOn: '2026-06-10',
				clearStartOn: true,
			}),
		).toEqual({
			html_notes: '<body>Updated</body>',
			privacy_setting: 'private',
			default_view: 'board',
			due_on: '2026-06-10',
			start_on: null,
		})
	})

	it('buildProjectCreateFields carries the archived flag when it is given', () => {
		expect(buildProjectCreateFields({ archived: true })).toEqual({ archived: true })
		expect(buildProjectCreateFields({})).toEqual({})
	})

	it('buildProjectUpdateFields carries the archived flag in both directions', () => {
		expect(buildProjectUpdateFields({ archived: true })).toEqual({ archived: true })
		expect(buildProjectUpdateFields({ archived: false })).toEqual({ archived: false })
		expect(buildProjectUpdateFields({})).toEqual({})
	})

	it('buildProjectCreateFields carries the owner when it is given', () => {
		expect(buildProjectCreateFields({ owner: 'me' })).toEqual({ owner: 'me' })
	})

	it('buildProjectUpdateFields maps the clear owner flag to owner null', () => {
		expect(buildProjectUpdateFields({ clearOwner: true })).toEqual({ owner: null })
		expect(buildProjectUpdateFields({ owner: '12345' })).toEqual({ owner: '12345' })
	})

	it('buildProjectUpdateFields rejects owner and clear_owner together', () => {
		expect(() => buildProjectUpdateFields({ owner: '12345', clearOwner: true })).toThrow(
			'--owner and --clear-owner are mutually exclusive',
		)
	})
})
