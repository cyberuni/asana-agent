import { basename } from 'node:path'

export type AttachmentCreateFields = {
	file?: string
	url?: string
	name?: string
}

// Asana's upload endpoint takes either file bytes or an external URL, never both.
// Normalizing here keeps the choice — and its default name — in one place that
// the CLI, the MCP tool, and the api facade all share.
export type AttachmentCreateInput =
	| { kind: 'file'; path: string; name: string }
	| { kind: 'url'; url: string; name: string }

export function buildAttachmentCreateInput(fields: AttachmentCreateFields): AttachmentCreateInput {
	if (fields.file !== undefined && fields.url !== undefined) {
		throw new Error('A file path and a url are mutually exclusive')
	}
	if (fields.file !== undefined) {
		return { kind: 'file', path: fields.file, name: fields.name ?? basename(fields.file) }
	}
	if (fields.url !== undefined) {
		return { kind: 'url', url: fields.url, name: fields.name ?? fields.url }
	}
	throw new Error('Provide either a file path or a url to attach')
}
