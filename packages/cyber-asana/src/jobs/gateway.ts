import Asana from 'asana'
import type { Job } from '../job-polling.js'

export type JobGateway = {
	getJob(jobGid: string): Promise<Job>
}

export function createAsanaJobGateway(client: Asana.ApiClient): JobGateway {
	const jobsApi = new Asana.JobsApi(client)

	return {
		async getJob(jobGid) {
			const res = await jobsApi.getJob(jobGid, {})
			return res.data
		},
	}
}
