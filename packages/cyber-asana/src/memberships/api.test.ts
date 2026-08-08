import { describe, expect, it, vi } from 'vitest'
import { createMembershipApi } from './api.js'
import type { MembershipGateway } from './gateway.js'

const mockMembership = { gid: 'm1', member: { gid: 'u1', name: 'Ada' }, access_level: 'editor' }

function createGateway(overrides: Partial<MembershipGateway> = {}): MembershipGateway {
	return {
		listMemberships: vi.fn(),
		getMembership: vi.fn(),
		createMembership: vi.fn(),
		updateMembership: vi.fn(),
		deleteMembership: vi.fn(),
		...overrides,
	}
}

describe('createMembershipApi', () => {
	it('uses the provided gateway for listMemberships', async () => {
		const listMemberships = vi.fn().mockResolvedValue({ data: [mockMembership], next_page: null, limit: 100 })
		const api = createMembershipApi(createGateway({ listMemberships }))

		const result = await api.listMemberships({ parent: 'proj1' }, { limit: 25 })

		expect(result).toEqual({ data: [mockMembership], next_page: null, limit: 100 })
		expect(listMemberships).toHaveBeenCalledWith({ parent: 'proj1' }, { limit: 25 })
	})

	it('uses the provided gateway for getMembership', async () => {
		const getMembership = vi.fn().mockResolvedValue(mockMembership)
		const api = createMembershipApi(createGateway({ getMembership }))

		expect(await api.getMembership('m1')).toEqual(mockMembership)
		expect(getMembership).toHaveBeenCalledWith('m1')
	})

	it('uses the provided gateway for createMembership', async () => {
		const createMembership = vi.fn().mockResolvedValue(mockMembership)
		const api = createMembershipApi(createGateway({ createMembership }))

		await api.createMembership('proj1', 'u1', { access_level: 'editor' })

		expect(createMembership).toHaveBeenCalledWith('proj1', 'u1', { access_level: 'editor' })
	})

	it('uses the provided gateway for updateMembership', async () => {
		const updateMembership = vi.fn().mockResolvedValue(mockMembership)
		const api = createMembershipApi(createGateway({ updateMembership }))

		await api.updateMembership('m1', { access_level: 'viewer' })

		expect(updateMembership).toHaveBeenCalledWith('m1', { access_level: 'viewer' })
	})

	it('uses the provided gateway for deleteMembership', async () => {
		const deleteMembership = vi.fn().mockResolvedValue(undefined)
		const api = createMembershipApi(createGateway({ deleteMembership }))

		await api.deleteMembership('m1')

		expect(deleteMembership).toHaveBeenCalledWith('m1')
	})
})
