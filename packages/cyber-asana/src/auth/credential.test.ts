import { describe, expect, it } from 'vitest'
import { maskToken, resolveCredential } from './credential.js'

describe('resolveCredential', () => {
	it('reports unauthenticated when no token is available', () => {
		const result = resolveCredential({ env: {} })
		expect(result.authenticated).toBe(false)
		expect(result.token).toBeUndefined()
		expect(result.source).toBeUndefined()
	})

	it('uses ASANA_ACCESS_TOKEN and names it as the source', () => {
		const result = resolveCredential({ env: { ASANA_ACCESS_TOKEN: 'access-token' } })
		expect(result.authenticated).toBe(true)
		expect(result.token).toBe('access-token')
		expect(result.source).toBe('ASANA_ACCESS_TOKEN')
	})

	it('falls back to the deprecated ASANA_TOKEN and names it as the source', () => {
		const result = resolveCredential({ env: { ASANA_TOKEN: 'legacy-token' } })
		expect(result.token).toBe('legacy-token')
		expect(result.source).toBe('ASANA_TOKEN')
	})

	it('prefers the --token flag over every environment variable', () => {
		const result = resolveCredential({
			tokenOverride: 'flag-token',
			env: { ASANA_ACCESS_TOKEN: 'access-token' },
		})
		expect(result.token).toBe('flag-token')
		expect(result.source).toBe('--token')
	})

	it('lists environment variables shadowed by the --token flag', () => {
		const result = resolveCredential({
			tokenOverride: 'flag-token',
			env: { ASANA_ACCESS_TOKEN: 'access-token', ASANA_TOKEN: 'legacy-token' },
		})
		expect(result.shadowed).toEqual(['ASANA_ACCESS_TOKEN', 'ASANA_TOKEN'])
	})

	it('lists ASANA_TOKEN as shadowed when ASANA_ACCESS_TOKEN wins', () => {
		const result = resolveCredential({
			env: { ASANA_ACCESS_TOKEN: 'access-token', ASANA_TOKEN: 'legacy-token' },
		})
		expect(result.source).toBe('ASANA_ACCESS_TOKEN')
		expect(result.shadowed).toEqual(['ASANA_TOKEN'])
	})

	it('reports nothing shadowed when only one source is present', () => {
		const result = resolveCredential({ env: { ASANA_ACCESS_TOKEN: 'access-token' } })
		expect(result.shadowed).toEqual([])
	})

	it('ignores environment variables set to an empty string', () => {
		const result = resolveCredential({ env: { ASANA_ACCESS_TOKEN: '', ASANA_TOKEN: 'legacy-token' } })
		expect(result.token).toBe('legacy-token')
		expect(result.source).toBe('ASANA_TOKEN')
		expect(result.shadowed).toEqual([])
	})

	it('ignores a --token flag set to an empty string', () => {
		const result = resolveCredential({ tokenOverride: '', env: { ASANA_TOKEN: 'legacy-token' } })
		expect(result.token).toBe('legacy-token')
		expect(result.source).toBe('ASANA_TOKEN')
	})

	it('reads process.env when no environment is injected', () => {
		const result = resolveCredential({})
		expect(result).toHaveProperty('authenticated')
	})
})

describe('maskToken', () => {
	it('reveals only the last four characters', () => {
		expect(maskToken('1/1201234567890:abcdef')).toBe('…cdef')
	})

	it('reveals nothing when the token is too short to mask', () => {
		expect(maskToken('abcd')).toBe('…')
	})
})
