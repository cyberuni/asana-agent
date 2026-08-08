import { createClient } from '../client.js'
import { type Job, type WaitForJobOptions, waitForJob } from '../job-polling.js'
import type { PaginationOptions } from '../pagination.js'
import { createAsanaTaskTemplateGateway, type InstantiateTaskFields, type TaskTemplateGateway } from './gateway.js'

export type TaskTemplateApi = ReturnType<typeof createTaskTemplateApi>

export function createTaskTemplateApi(gateway: TaskTemplateGateway) {
	return {
		listTaskTemplates(projectGid: string, opts?: PaginationOptions) {
			return gateway.listTaskTemplates(projectGid, opts)
		},
		getTaskTemplate(taskTemplateGid: string) {
			return gateway.getTaskTemplate(taskTemplateGid)
		},
		async instantiateTask(
			taskTemplateGid: string,
			fields?: InstantiateTaskFields,
			opts?: WaitForJobOptions,
		): Promise<Job> {
			const job = await gateway.instantiateTask(taskTemplateGid, fields)
			return await waitForJob(job, (jobGid) => gateway.getJob(jobGid), opts)
		},
	}
}

function defaultTaskTemplateApi() {
	return createTaskTemplateApi(createAsanaTaskTemplateGateway(createClient()))
}

export async function listTaskTemplates(projectGid: string, opts?: PaginationOptions) {
	return defaultTaskTemplateApi().listTaskTemplates(projectGid, opts)
}

export async function getTaskTemplate(taskTemplateGid: string) {
	return defaultTaskTemplateApi().getTaskTemplate(taskTemplateGid)
}

export async function instantiateTask(
	taskTemplateGid: string,
	fields?: InstantiateTaskFields,
	opts?: WaitForJobOptions,
) {
	return defaultTaskTemplateApi().instantiateTask(taskTemplateGid, fields, opts)
}
