import { describe } from 'vitest'
import { createRuntimeContext, type RuntimeContext } from '../composition.js'
import { isSystemTestEnabled, systemEnv } from '../testing/system.js'
import { defineMembershipListPaginationAcceptanceSpecs } from './list-pagination.acceptance.js'

const projectGid = systemEnv('ASANA_SYSTEM_TEST_PROJECT_GID')
const systemEnabled = isSystemTestEnabled() && Boolean(projectGid)

let runtimeContext: RuntimeContext | undefined

function getMembershipApi() {
	runtimeContext ??= createRuntimeContext()
	return runtimeContext.memberships
}

describe.skipIf(!systemEnabled)(
	'memberships/api list pagination system',
	defineMembershipListPaginationAcceptanceSpecs({
		getApi: getMembershipApi,
		filters: { parent: projectGid! },
		includeFetchAll: false,
	}),
)
