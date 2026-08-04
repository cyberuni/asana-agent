import { expect, it } from 'vitest'
import type { StoryApi } from './api.js'

export type StoryCreateAcceptanceDeps = {
	getApi: () => Pick<StoryApi, 'createStory'>
	taskGid: string
}

export function defineStoryCreateAcceptanceSpecs(deps: StoryCreateAcceptanceDeps) {
	return () => {
		it('forwards validated html_text to the gateway', async () => {
			const api = deps.getApi()
			await api.createStory(deps.taskGid, { html_text: '<body><strong>Ship it</strong></body>' })
		})

		it('rejects invalid html_text before calling the gateway', async () => {
			const api = deps.getApi()
			await expect(api.createStory(deps.taskGid, { html_text: '<div>bad</div>' })).rejects.toThrow(/body/)
		})

		it('does not attribute a locally-rejected html_text payload to Asana', async () => {
			const api = deps.getApi()
			const error = await api
				.createStory(deps.taskGid, { html_text: '<body><strong>bad</body>' })
				.then(() => undefined)
				.catch((thrown: unknown) => thrown)

			expect(error).toBeInstanceOf(Error)
			expect((error as Error).message).not.toMatch(/Asana rejected/)
			expect((error as Error).message).toMatch(/unbalanced/)
		})

		it('rejects conflicting text and html_text fields', async () => {
			const api = deps.getApi()
			await expect(api.createStory(deps.taskGid, { text: 'plain', html_text: '<body>rich</body>' })).rejects.toThrow(
				/mutually exclusive/,
			)
		})
	}
}
