import { describe } from 'vitest'
import { createRuntimeContext, type RuntimeContext } from '../composition.js'
import { isSystemTestEnabled, systemEnv } from '../testing/system.js'
import { defineCustomFieldListPaginationAcceptanceSpecs } from './list-pagination.acceptance.js'

const workspaceGid = systemEnv('ASANA_WORKSPACE')
const systemEnabled = isSystemTestEnabled() && Boolean(workspaceGid)

let runtimeContext: RuntimeContext | undefined

function getCustomFieldApi() {
	runtimeContext ??= createRuntimeContext()
	return runtimeContext.customFields
}

describe.skipIf(!systemEnabled)(
	'custom-fields/api list pagination system',
	defineCustomFieldListPaginationAcceptanceSpecs({
		getApi: getCustomFieldApi,
		workspaceGid: workspaceGid!,
		includeFetchAll: false,
	}),
)
