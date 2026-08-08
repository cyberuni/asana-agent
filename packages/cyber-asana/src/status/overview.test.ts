import { describe, expect, it, vi } from 'vitest'
import { getStatusOverview, type StatusOverviewDeps } from './overview.js'

const projectStatus = {
	gid: 'st1',
	title: 'Week 12',
	status_type: 'on_track',
	created_at: '2026-08-01T00:00:00.000Z',
	text: 'Shipping on schedule',
}

const counts = { num_tasks: 10, num_completed_tasks: 4, num_incomplete_tasks: 6 }

function makeDeps(over: Partial<StatusOverviewDeps> = {}): StatusOverviewDeps {
	return {
		status: { listStatuses: vi.fn().mockResolvedValue([]) },
		portfolios: {
			getPortfolio: vi.fn().mockRejectedValue(new Error('not a portfolio')),
			listPortfolioItems: vi.fn().mockResolvedValue([]),
		},
		projects: {
			getProject: vi.fn().mockResolvedValue({ gid: 'proj1', name: 'Apollo' }),
			getProjectTaskCounts: vi.fn().mockResolvedValue(counts),
		},
		...over,
	}
}

describe('getStatusOverview', () => {
	it('rolls a project parent up into its own latest status and task counts', async () => {
		const deps = makeDeps({
			status: { listStatuses: vi.fn().mockResolvedValue([projectStatus]) },
		})

		const overview = await getStatusOverview(deps, 'proj1', { parentType: 'project' })

		expect(overview).toEqual({
			parent: {
				gid: 'proj1',
				name: 'Apollo',
				resource_type: 'project',
				status: projectStatus,
				counts,
			},
			items: [],
			item_count: 0,
			item_limit: 25,
			truncated: false,
		})
	})

	it('asks for only the latest status update of the parent', async () => {
		const listStatuses = vi.fn().mockResolvedValue([projectStatus])
		const deps = makeDeps({ status: { listStatuses } })

		await getStatusOverview(deps, 'proj1', { parentType: 'project' })

		expect(listStatuses).toHaveBeenCalledWith('proj1', {
			limit: 1,
			optFields: 'gid,title,status_type,created_at,text',
		})
	})

	it('reports a null status when the parent has never been updated', async () => {
		const deps = makeDeps({ status: { listStatuses: vi.fn().mockResolvedValue([]) } })

		const overview = await getStatusOverview(deps, 'proj1', { parentType: 'project' })

		expect(overview.parent.status).toBeNull()
	})

	it('rolls a portfolio parent up into one entry per item', async () => {
		const listStatuses = vi.fn(async (gid: string) => (gid === 'p1' ? [projectStatus] : []))
		const deps = makeDeps({
			status: { listStatuses },
			portfolios: {
				getPortfolio: vi.fn().mockResolvedValue({ gid: 'pf1', name: 'Q3 bets' }),
				listPortfolioItems: vi.fn().mockResolvedValue([
					{ gid: 'p1', name: 'Apollo', resource_type: 'project' },
					{ gid: 'p2', name: 'Borealis', resource_type: 'project' },
				]),
			},
		})

		const overview = await getStatusOverview(deps, 'pf1')

		expect(overview.parent).toEqual({
			gid: 'pf1',
			name: 'Q3 bets',
			resource_type: 'portfolio',
			status: null,
			counts: null,
		})
		expect(overview.items).toEqual([
			{ gid: 'p1', name: 'Apollo', resource_type: 'project', status: projectStatus, counts },
			{ gid: 'p2', name: 'Borealis', resource_type: 'project', status: null, counts },
		])
		expect(overview.item_count).toBe(2)
	})

	it('leaves counts null for a portfolio item that is not a project', async () => {
		const getProjectTaskCounts = vi.fn().mockResolvedValue(counts)
		const deps = makeDeps({
			portfolios: {
				getPortfolio: vi.fn().mockResolvedValue({ gid: 'pf1', name: 'Q3 bets' }),
				listPortfolioItems: vi.fn().mockResolvedValue([{ gid: 'pf2', name: 'Nested', resource_type: 'portfolio' }]),
			},
			projects: { getProject: vi.fn(), getProjectTaskCounts },
		})

		const overview = await getStatusOverview(deps, 'pf1')

		expect(overview.items[0]?.counts).toBeNull()
		expect(getProjectTaskCounts).not.toHaveBeenCalled()
	})

	it('caps the item fan-out and reports the truncation', async () => {
		const listPortfolioItems = vi.fn().mockResolvedValue({
			data: [{ gid: 'p1', name: 'Apollo', resource_type: 'project' }],
			next_page: { offset: 'more' },
			limit: 1,
		})
		const deps = makeDeps({
			portfolios: { getPortfolio: vi.fn().mockResolvedValue({ gid: 'pf1', name: 'Q3 bets' }), listPortfolioItems },
		})

		const overview = await getStatusOverview(deps, 'pf1', { limit: 1 })

		expect(listPortfolioItems).toHaveBeenCalledWith('pf1', { limit: 1, optFields: 'gid,name,resource_type' })
		expect(overview.item_limit).toBe(1)
		expect(overview.truncated).toBe(true)
	})

	it('detects a portfolio parent before falling back to a project', async () => {
		const getProject = vi.fn()
		const deps = makeDeps({
			portfolios: {
				getPortfolio: vi.fn().mockResolvedValue({ gid: 'pf1', name: 'Q3 bets' }),
				listPortfolioItems: vi.fn().mockResolvedValue([]),
			},
			projects: { getProject, getProjectTaskCounts: vi.fn() },
		})

		const overview = await getStatusOverview(deps, 'pf1')

		expect(overview.parent.resource_type).toBe('portfolio')
		expect(getProject).not.toHaveBeenCalled()
	})

	it('falls back to the project gateway when the parent is not a portfolio', async () => {
		const getPortfolio = vi.fn().mockRejectedValue(new Error('not a portfolio'))
		const deps = makeDeps({
			portfolios: { getPortfolio, listPortfolioItems: vi.fn() },
			status: { listStatuses: vi.fn().mockResolvedValue([projectStatus]) },
		})

		const overview = await getStatusOverview(deps, 'proj1')

		expect(getPortfolio).toHaveBeenCalledWith('proj1')
		expect(overview.parent.resource_type).toBe('project')
		expect(overview.parent.counts).toEqual(counts)
	})

	it('skips portfolio detection when the parent type is given as project', async () => {
		const getPortfolio = vi.fn()
		const deps = makeDeps({ portfolios: { getPortfolio, listPortfolioItems: vi.fn() } })

		await getStatusOverview(deps, 'proj1', { parentType: 'project' })

		expect(getPortfolio).not.toHaveBeenCalled()
	})

	it('surfaces the project error when the gid is neither a portfolio nor a project', async () => {
		const deps = makeDeps({
			portfolios: { getPortfolio: vi.fn().mockRejectedValue(new Error('nope')), listPortfolioItems: vi.fn() },
			projects: { getProject: vi.fn().mockRejectedValue(new Error('Not a project')), getProjectTaskCounts: vi.fn() },
		})

		await expect(getStatusOverview(deps, 'bogus')).rejects.toThrow('Not a project')
	})
})
