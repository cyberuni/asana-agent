import { describe, expect, it, vi } from 'vitest'
import { createRuleApi } from './api.js'

describe('createRuleApi', () => {
	it('forwards the trigger gid, resource, and action data to the gateway', async () => {
		const triggerRule = vi.fn().mockResolvedValue(null)
		const api = createRuleApi({ triggerRule })

		await api.triggerRule('rt1', { resource: 'task1', action_data: { deploy: 'v2' } })

		expect(triggerRule).toHaveBeenCalledWith('rt1', { resource: 'task1', action_data: { deploy: 'v2' } })
	})

	it('acknowledges the trigger so an empty Asana response is still legible', async () => {
		const api = createRuleApi({ triggerRule: vi.fn().mockResolvedValue(null) })

		const result = await api.triggerRule('rt1', { resource: 'task1' })

		expect(result).toEqual({ triggered: true, rule_trigger_gid: 'rt1', resource: 'task1' })
	})

	it('omits resource from the acknowledgement when the rule was fired without one', async () => {
		const api = createRuleApi({ triggerRule: vi.fn().mockResolvedValue(null) })

		const result = await api.triggerRule('rt1')

		expect(result).toEqual({ triggered: true, rule_trigger_gid: 'rt1' })
	})

	it('carries the Asana response through when the endpoint returns one', async () => {
		const api = createRuleApi({ triggerRule: vi.fn().mockResolvedValue({ gid: 'rt1' }) })

		const result = await api.triggerRule('rt1')

		expect(result).toEqual({ triggered: true, rule_trigger_gid: 'rt1', data: { gid: 'rt1' } })
	})
})
