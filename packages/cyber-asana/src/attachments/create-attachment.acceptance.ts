import { expect, it } from 'vitest'
import type { AttachmentApi } from './api.js'

export type AttachmentCreateAcceptanceDeps = {
	getApi: () => Pick<AttachmentApi, 'createAttachment'>
	parentGid: string
	/** A path to a readable file on the machine running the spec. */
	filePath: string
}

export function defineAttachmentCreateAcceptanceSpecs(deps: AttachmentCreateAcceptanceDeps) {
	return () => {
		it('attaches a local file to the parent object', async () => {
			const api = deps.getApi()
			const attachment = await api.createAttachment(deps.parentGid, { file: deps.filePath })

			expect(attachment).toBeDefined()
		})

		it('attaches an external url to the parent object', async () => {
			const api = deps.getApi()
			const attachment = await api.createAttachment(deps.parentGid, {
				url: 'https://example.com/design',
				name: 'Design doc',
			})

			expect(attachment).toBeDefined()
		})

		it('rejects a request carrying both a file and a url before calling Asana', async () => {
			const api = deps.getApi()
			await expect(
				api.createAttachment(deps.parentGid, { file: deps.filePath, url: 'https://example.com' }),
			).rejects.toThrow(/mutually exclusive/)
		})

		it('rejects a request carrying neither a file nor a url before calling Asana', async () => {
			const api = deps.getApi()
			await expect(api.createAttachment(deps.parentGid, {})).rejects.toThrow(/Provide either a file path or a url/)
		})

		it('reports a missing file without attributing the failure to Asana', async () => {
			const api = deps.getApi()
			const error = await api
				.createAttachment(deps.parentGid, { file: `${deps.filePath}.does-not-exist` })
				.then(() => undefined)
				.catch((thrown: unknown) => thrown)

			expect(error).toBeInstanceOf(Error)
			expect((error as Error).message).toMatch(/does-not-exist/)
		})
	}
}
