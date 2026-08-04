import { afterEach, describe, expect, it, vi } from 'vitest'
import { printNextPageHint } from './cli-options.js'

describe('printNextPageHint', () => {
	afterEach(() => vi.restoreAllMocks())

	const page = { data: [{ gid: '1' }], next_page: { offset: 'cursor-abc' } }

	it('prints the offset in text mode', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
		printNextPageHint(page, ['node', 'cli'])
		expect(spy).toHaveBeenCalledWith('\nNext offset: cursor-abc')
	})

	it('stays silent in json mode', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
		printNextPageHint(page, ['node', 'cli', '--json'])
		expect(spy).not.toHaveBeenCalled()
	})

	it('stays silent in toon mode', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
		printNextPageHint(page, ['node', 'cli', '--toon'])
		expect(spy).not.toHaveBeenCalled()
	})

	it('stays silent when there is no next page', () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
		printNextPageHint({ data: [], next_page: null }, ['node', 'cli'])
		expect(spy).not.toHaveBeenCalled()
	})
})
