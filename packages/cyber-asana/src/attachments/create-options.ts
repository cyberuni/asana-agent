import { basename } from 'node:path'

export type AttachmentCreateFields = {
	file?: string
	url?: string
	name?: string
	connectToApp?: boolean
}

// Asana's upload endpoint takes either file bytes or an external URL, never both.
// Normalizing here keeps the choice — and its default name — in one place that
// the CLI, the MCP tool, and the api facade all share.
export type AttachmentCreateInput =
	| { kind: 'file'; path: string; name: string }
	| { kind: 'url'; url: string; name: string; connectToApp?: boolean }

export function buildAttachmentCreateInput(fields: AttachmentCreateFields): AttachmentCreateInput {
	if (fields.file !== undefined && fields.url !== undefined) {
		throw new Error('A file path and a url are mutually exclusive')
	}
	// Asana honours connect_to_app only on an external attachment, so a flag that
	// would be silently dropped is a local usage error instead.
	if (fields.connectToApp && fields.url === undefined) {
		throw new Error('--connect-to-app applies to an external --url attachment')
	}
	if (fields.file !== undefined) {
		return { kind: 'file', path: fields.file, name: fields.name ?? basename(fields.file) }
	}
	if (fields.url !== undefined) {
		return {
			kind: 'url',
			url: fields.url,
			name: fields.name ?? fields.url,
			...(fields.connectToApp !== undefined && { connectToApp: fields.connectToApp }),
		}
	}
	throw new Error('Provide either a file path or a url to attach')
}
