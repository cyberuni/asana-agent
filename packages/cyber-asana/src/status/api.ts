import { createClient } from '../client.js'
import type { PaginationOptions } from '../pagination.js'
import { createAsanaPortfolioGateway } from '../portfolios/gateway.js'
import { createAsanaProjectGateway } from '../projects/gateway.js'
import { createAsanaStatusGateway, type StatusCreateFields, type StatusGateway } from './gateway.js'
import { getStatusOverview as rollUpStatus, type StatusOverviewDeps, type StatusOverviewOptions } from './overview.js'

export type {
	StatusOverview,
	StatusOverviewEntry,
	StatusOverviewOptions,
	StatusOverviewParentType,
} from './overview.js'

/** Gateways the status roll-up composes beyond the status gateway itself. */
export type StatusOverviewGateways = Pick<StatusOverviewDeps, 'portfolios' | 'projects'>

export type StatusApi = ReturnType<typeof createStatusApi>

export function createStatusApi(gateway: StatusGateway, overviewGateways: StatusOverviewGateways) {
	return {
		listStatuses(parentGid: string, opts?: PaginationOptions) {
			return gateway.listStatuses(parentGid, opts)
		},
		getStatus(statusGid: string) {
			return gateway.getStatus(statusGid)
		},
		createStatus(parentGid: string, fields: StatusCreateFields) {
			return gateway.createStatus(parentGid, fields)
		},
		deleteStatus(statusGid: string) {
			return gateway.deleteStatus(statusGid)
		},
		getStatusOverview(parentGid: string, opts?: StatusOverviewOptions) {
			return rollUpStatus({ status: gateway, ...overviewGateways }, parentGid, opts)
		},
	}
}

function defaultStatusApi() {
	const client = createClient()
	return createStatusApi(createAsanaStatusGateway(client), {
		portfolios: createAsanaPortfolioGateway(client),
		projects: createAsanaProjectGateway(client),
	})
}

export async function listStatuses(parentGid: string, opts?: PaginationOptions) {
	return defaultStatusApi().listStatuses(parentGid, opts)
}

export async function getStatus(statusGid: string) {
	return defaultStatusApi().getStatus(statusGid)
}

export async function createStatus(parentGid: string, fields: StatusCreateFields) {
	return defaultStatusApi().createStatus(parentGid, fields)
}

export async function deleteStatus(statusGid: string) {
	return defaultStatusApi().deleteStatus(statusGid)
}

export async function getStatusOverview(parentGid: string, opts?: StatusOverviewOptions) {
	return defaultStatusApi().getStatusOverview(parentGid, opts)
}
