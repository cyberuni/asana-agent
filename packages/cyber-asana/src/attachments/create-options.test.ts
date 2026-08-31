import { describe, expect, it } from 'vitest'
import { buildAttachmentCreateInput } from './create-options.js'

describe('buildAttachmentCreateInput', () => {
	it('defaults a file attachment name to the basename of the path', () => {
		expect(buildAttachmentCreateInput({ file: './reports/sprint.md' })).toEqual({
			kind: 'file',
			path: './reports/sprint.md',
			name: 'sprint.md',
		})
	})

	it('keeps an explicit name for a file attachment', () => {
		expect(buildAttachmentCreateInput({ file: './reports/sprint.md', name: 'Sprint report.md' })).toEqual({
			kind: 'file',
			path: './reports/sprint.md',
			name: 'Sprint report.md',
		})
	})

	it('defaults a url attachment name to the url itself', () => {
		expect(buildAttachmentCreateInput({ url: 'https://example.com/design' })).toEqual({
			kind: 'url',
			url: 'https://example.com/design',
			name: 'https://example.com/design',
		})
	})

	it('rejects a request that carries both a file and a url', () => {
		expect(() => buildAttachmentCreateInput({ file: './a.txt', url: 'https://example.com' })).toThrow(
			/mutually exclusive/,
		)
	})

	it('rejects a request that carries neither a file nor a url', () => {
		expect(() => buildAttachmentCreateInput({})).toThrow(/Provide either a file path or a url/)
	})
	it('carries connectToApp on a url attachment', () => {
		expect(buildAttachmentCreateInput({ url: 'https://example.com/design', connectToApp: true })).toEqual({
			kind: 'url',
			url: 'https://example.com/design',
			name: 'https://example.com/design',
			connectToApp: true,
		})
	})

	it('rejects connectToApp on a file upload, which Asana does not honour', () => {
		expect(() => buildAttachmentCreateInput({ file: './a.txt', connectToApp: true })).toThrow(
			'--connect-to-app applies to an external --url attachment',
		)
	})
})
