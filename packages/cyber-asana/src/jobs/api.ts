import { createClient } from '../client.js'
import type { Job } from '../job-polling.js'
import { createAsanaJobGateway, type JobGateway } from './gateway.js'

export type { Job }

export type JobApi = ReturnType<typeof createJobApi>

export function createJobApi(gateway: JobGateway) {
	return {
		getJob(jobGid: string) {
			return gateway.getJob(jobGid)
		},
	}
}

function defaultJobApi() {
	return createJobApi(createAsanaJobGateway(createClient()))
}

export async function getJob(jobGid: string) {
	return defaultJobApi().getJob(jobGid)
}
