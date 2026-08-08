import { describe } from 'vitest'
import { createRuntimeContext, type RuntimeContext } from '../composition.js'
import { isSystemTestEnabled, systemEnv } from '../testing/system.js'
import { defineTaskTemplateListPaginationAcceptanceSpecs } from './list-pagination.acceptance.js'

const projectGid = systemEnv('ASANA_SYSTEM_TEST_PROJECT_GID')
const systemEnabled = isSystemTestEnabled() && Boolean(projectGid)

let runtimeContext: RuntimeContext | undefined

function getTaskTemplateApi() {
	runtimeContext ??= createRuntimeContext()
	return runtimeContext.taskTemplates
}

describe.skipIf(!systemEnabled)(
	'task-templates/api list pagination system',
	defineTaskTemplateListPaginationAcceptanceSpecs({
		getApi: getTaskTemplateApi,
		projectGid: projectGid!,
		includeFetchAll: false,
	}),
)
