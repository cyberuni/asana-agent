import type { TagWriteFields } from './gateway.js'

/**
 * Asana takes `followers` when a tag is created but not when one is updated, so
 * the create payload is the write payload plus that one field.
 */
export type TagCreateFields = Omit<TagWriteFields, 'name'> & {
	followers?: string[]
}

/** Accepts the CLI's comma-separated form and the MCP tool's array form alike. */
export function parseFollowerGids(value?: string | string[]): string[] | undefined {
	const gids = (Array.isArray(value) ? value : (value?.split(',') ?? [])).map((gid) => gid.trim()).filter(Boolean)
	return gids.length > 0 ? gids : undefined
}
