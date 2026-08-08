import { afterEach, describe, expect, it, vi } from 'vitest'

const listCustomFieldsMock = vi.fn()
const getCustomFieldMock = vi.fn()

vi.mock('./api.js', async () => {
	const actual = await vi.importActual<typeof import('./api.js')>('./api.js')
	return {
		...actual,
		listCustomFields: listCustomFieldsMock,
		getCustomField: getCustomFieldMock,
	}
})

const { registerCustomFieldTools } = await import('./mcp.js')

type ToolHandler = (params: any) => Promise<any>

function createServer() {
	const handlers = new Map<string, ToolHandler>()
	return {
		handlers,
		tool(name: string, _description: string, _schema: unknown, handler: ToolHandler) {
			handlers.set(name, handler)
		},
	}
}

describe('custom-fields/mcp', () => {
	afterEach(() => {
		vi.clearAllMocks()
	})

	it('asana_custom_field_list forwards workspace gid and pagination options', async () => {
		listCustomFieldsMock.mockResolvedValue({
			data: [{ gid: 'cf1', name: 'Priority', resource_subtype: 'enum' }],
			next_page: null,
			limit: 100,
		})
		const server = createServer()
		registerCustomFieldTools(server as any)

		const result = await server.handlers.get('asana_custom_field_list')?.({
			workspace_gid: 'ws1',
			limit: 50,
			opt_fields: 'gid,name',
		})

		expect(listCustomFieldsMock).toHaveBeenCalledWith('ws1', {
			limit: 50,
			optFields: 'gid,name',
		})
		expect(JSON.parse(result.content[0].text).data).toEqual([
			{ gid: 'cf1', name: 'Priority', resource_subtype: 'enum' },
		])
	})

	it('asana_custom_field_get forwards the custom field gid and returns its enum options', async () => {
		getCustomFieldMock.mockResolvedValue({
			gid: 'cf1',
			name: 'Priority',
			resource_subtype: 'enum',
			enum_options: [{ gid: 'opt1', name: 'High' }],
		})
		const server = createServer()
		registerCustomFieldTools(server as any)

		const result = await server.handlers.get('asana_custom_field_get')?.({ custom_field_gid: 'cf1' })

		expect(getCustomFieldMock).toHaveBeenCalledWith('cf1')
		expect(JSON.parse(result.content[0].text).enum_options).toEqual([{ gid: 'opt1', name: 'High' }])
	})

	it('custom field tools can use injected dependencies', async () => {
		const injectedGetCustomField = vi.fn().mockResolvedValue({ gid: 'cf1', name: 'Priority' })
		const server = createServer()
		registerCustomFieldTools(server as any, {
			listCustomFields: vi.fn(),
			getCustomField: injectedGetCustomField,
		})

		await server.handlers.get('asana_custom_field_get')?.({ custom_field_gid: 'cf1' })

		expect(injectedGetCustomField).toHaveBeenCalledWith('cf1')
	})
})
