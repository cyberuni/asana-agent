/**
 * The Events API is a polling change feed, not a paginated list: a call carries a
 * sync token forward instead of an offset cursor, and the token — not the page —
 * is the state the caller has to keep.
 *
 * Asana signals "you have no usable token, start here" with a `412 Precondition
 * Failed` that carries a fresh token in its body. That is the documented first-run
 * path (and the expiry path), not a failure, so it is normalized into a feed with
 * no events and `sync_reset: true` rather than surfaced as an error.
 */

export type EventFeed = {
	data: any[]
	sync?: string
	has_more: boolean
	/** True when Asana replaced the token instead of returning events — first run or an expired token. */
	sync_reset: boolean
}

export function normalizeEventFeed(body: unknown): EventFeed {
	const source = (body ?? {}) as { data?: unknown; sync?: unknown; has_more?: unknown }
	return {
		data: Array.isArray(source.data) ? source.data : [],
		...(typeof source.sync === 'string' && { sync: source.sync }),
		has_more: source.has_more === true,
		sync_reset: false,
	}
}

/**
 * The replacement sync token Asana returns with a `412`, or undefined when the
 * error is anything else — including a `412` with no token to continue from.
 */
export function freshSyncTokenFromError(error: unknown): string | undefined {
	if (!error || typeof error !== 'object' || !('response' in error)) return undefined
	const response = (error as { response?: { status?: number; body?: { sync?: unknown } } }).response
	if (response?.status !== 412) return undefined
	return typeof response.body?.sync === 'string' ? response.body.sync : undefined
}

/**
 * Runs one Events API call and folds the sync-token handshake into the result, so
 * every caller sees a feed and only real failures propagate.
 */
export async function readEventFeed(call: () => Promise<unknown>): Promise<EventFeed> {
	try {
		return normalizeEventFeed(await call())
	} catch (error) {
		const sync = freshSyncTokenFromError(error)
		if (sync === undefined) throw error
		return { data: [], sync, has_more: false, sync_reset: true }
	}
}
