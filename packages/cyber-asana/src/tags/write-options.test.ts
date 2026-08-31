import { describe, expect, it } from 'vitest'
import { parseFollowerGids } from './write-options.js'

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
})
