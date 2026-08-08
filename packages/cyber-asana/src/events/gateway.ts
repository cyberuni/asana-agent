import Asana from 'asana'
import { type EventFeed, readEventFeed } from './feed.js'

export type EventFeedOptions = {
	/** Sync token from a previous call. Omit on the first call — Asana hands one back. */
	sync?: string
	optFields?: string
}

export type EventGateway = {
	getEvents(resourceGid: string, opts?: EventFeedOptions): Promise<EventFeed>
}

export function createAsanaEventGateway(client: Asana.ApiClient): EventGateway {
	const eventsApi = new Asana.EventsApi(client)

	return {
		async getEvents(resourceGid, opts) {
			// Not `toAsanaPaginationOptions` — the change feed is cursored by sync token,
			// not by limit/offset, and Asana caps a token at 100 events itself.
			return await readEventFeed(() =>
				eventsApi.getEvents(resourceGid, {
					...(opts?.sync !== undefined && { sync: opts.sync }),
					...(opts?.optFields !== undefined && { opt_fields: opts.optFields }),
				}),
			)
		},
	}
}
