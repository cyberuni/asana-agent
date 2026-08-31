import { describe, expect, it } from 'vitest'
import { buildTagUpdateFields, parseFollowerGids } from './write-options.js'

describe('tags/write-options', () => {
	it('parseFollowerGids splits a comma-separated list', () => {
		expect(parseFollowerGids('u1,u2')).toEqual(['u1', 'u2'])
	})

	it('parseFollowerGids trims surrounding whitespace and drops empties', () => {
		expect(parseFollowerGids(' u1 , , u2 ')).toEqual(['u1', 'u2'])
	})

	it('parseFollowerGids passes an array through unchanged', () => {
		expect(parseFollowerGids(['u1', 'u2'])).toEqual(['u1', 'u2'])
	})

	it('parseFollowerGids returns undefined when nothing was given', () => {
		expect(parseFollowerGids(undefined)).toBeUndefined()
		expect(parseFollowerGids('')).toBeUndefined()
		expect(parseFollowerGids([])).toBeUndefined()
	})

	it('buildTagUpdateFields sends only the fields that were given', () => {
		expect(buildTagUpdateFields({ color: 'dark-teal' })).toEqual({ color: 'dark-teal' })
	})

	it('buildTagUpdateFields sends a null colour when the colour is cleared', () => {
		expect(buildTagUpdateFields({ clearColor: true })).toEqual({ color: null })
	})

	it('buildTagUpdateFields rejects setting and clearing the colour at once', () => {
		expect(() => buildTagUpdateFields({ color: 'dark-teal', clearColor: true })).toThrow(
			'--color and --clear-color are mutually exclusive',
		)
	})

	it('buildTagUpdateFields sends an empty change set when no field was given', () => {
		expect(buildTagUpdateFields({})).toEqual({})
	})
})
