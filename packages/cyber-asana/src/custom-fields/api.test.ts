import { describe, expect, it, vi } from 'vitest'
import { createCustomFieldApi } from './api.js'

const mockCustomField = { gid: 'cf1', name: 'Priority', resource_subtype: 'enum' }

describe('createCustomFieldApi', () => {
	it('uses the provided gateway for listCustomFields', async () => {
		const mockListCustomFields = vi.fn().mockResolvedValue({ data: [mockCustomField], next_page: null, limit: 100 })
		const api = createCustomFieldApi({
			listCustomFields: mockListCustomFields,
			getCustomField: vi.fn(),
		})

		const result = await api.listCustomFields('ws1')

		expect(result).toEqual({ data: [mockCustomField], next_page: null, limit: 100 })
		expect(mockListCustomFields).toHaveBeenCalledWith('ws1', undefined)
	})

	it('uses the provided gateway for getCustomField', async () => {
		const mockGetCustomField = vi.fn().mockResolvedValue(mockCustomField)
		const api = createCustomFieldApi({
			listCustomFields: vi.fn(),
			getCustomField: mockGetCustomField,
		})

		const result = await api.getCustomField('cf1')

		expect(result).toEqual(mockCustomField)
		expect(mockGetCustomField).toHaveBeenCalledWith('cf1')
	})
})
