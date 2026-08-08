import { describe } from 'vitest'
import { createRuntimeContext, type RuntimeContext } from '../composition.js'
import { isSystemTestEnabled, systemEnv } from '../testing/system.js'
import { defineProjectTemplateListPaginationAcceptanceSpecs } from './list-pagination.acceptance.js'

const workspaceGid = systemEnv('ASANA_WORKSPACE')
const systemEnabled = isSystemTestEnabled() && Boolean(workspaceGid)

let runtimeContext: RuntimeContext | undefined

function getProjectTemplateApi() {
	runtimeContext ??= createRuntimeContext()
	return runtimeContext.projectTemplates
}

describe.skipIf(!systemEnabled)(
	'project-templates/api list pagination system',
	defineProjectTemplateListPaginationAcceptanceSpecs({
		getApi: getProjectTemplateApi,
		workspaceGid: workspaceGid!,
		includeFetchAll: false,
	}),
)
