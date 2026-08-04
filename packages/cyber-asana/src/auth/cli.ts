import { Command } from 'commander'
import { getTokenOverride } from '../client.js'
import { output, printFields, printNextSteps } from '../output.js'
import { type Credential, maskToken, resolveCredential } from './credential.js'
import { defaultLoginDeps, type LoginParams, performLogin } from './login.js'
import type { Tokens } from './oauth.js'
import { type AppSettings, configDir, readSettings, resolveAppCredentials } from './settings.js'
import { writeCredentials } from './token-store.js'

// `auth status` is a credential diagnostic that works when the credential does
// not — `user me` answers "who am I to Asana?" and needs a working token to
// answer at all. This answers "what will this process authenticate with?", so
// it stays local and treats "no credentials" as data, not failure.

/** Asana matches the redirect URI exactly, so the port cannot be ephemeral. */
const DEFAULT_CALLBACK_PORT = 7654

const REGISTRATION_HELP = `No Asana app registration found.

cyber-asana uses your own OAuth app, so nobody else's registration sees your
data. To create one:

  1. Go to https://app.asana.com/0/my-apps and create an app
  2. Add this redirect URL: http://localhost:${DEFAULT_CALLBACK_PORT}/callback
  3. Copy the client ID and client secret

Then either export them:

  export ASANA_CLIENT_ID=<client-id>
  export ASANA_CLIENT_SECRET=<client-secret>

or put them in settings.json under your config directory:

  {"client_id": "<client-id>", "client_secret": "<client-secret>"}

A personal access token remains the simpler option for a single user:
https://app.asana.com/0/my-apps`

export type AuthCommandDeps = {
	readCredential: () => Credential
	configDir: () => string
	readSettings: (dir: string) => Promise<AppSettings>
	login: (params: LoginParams) => Promise<Tokens>
	writeCredentials: (dir: string, tokens: Tokens) => Promise<void>
}

function defaultDeps(): AuthCommandDeps {
	return {
		readCredential: () => resolveCredential({ tokenOverride: getTokenOverride() }),
		configDir: () => configDir(),
		readSettings,
		login: (params) => performLogin(params, defaultLoginDeps()),
		writeCredentials,
	}
}

function parseScopes(value: string | undefined): string[] | undefined {
	if (!value) return undefined
	const scopes = value
		.split(',')
		.map((scope) => scope.trim())
		.filter(Boolean)
	return scopes.length > 0 ? scopes : undefined
}

function describeUser(user: Tokens['user']): string | null {
	if (!user) return null
	return user.email ? `${user.name ?? user.gid} <${user.email}>` : (user.name ?? user.gid)
}

export function authCommand(overrides: Partial<AuthCommandDeps> = {}) {
	const deps = { ...defaultDeps(), ...overrides }
	const cmd = new Command('auth').description('Inspect and manage Asana credentials')

	cmd.addHelpText(
		'after',
		[
			'',
			'Examples:',
			'  cyber-asana auth status',
			'  cyber-asana auth login',
			'  cyber-asana auth login --no-store --raw',
			'',
			'Every subcommand supports --help for its own options.',
		].join('\n'),
	)

	cmd
		.command('status')
		.description('Show which credential this CLI will use, without calling the Asana API')
		.action(() => {
			const credential = deps.readCredential()
			output(
				{
					authenticated: credential.authenticated,
					source: credential.source ?? null,
					masked_token: credential.token ? maskToken(credential.token) : null,
					shadowed: credential.shadowed,
				},
				() => {
					if (!credential.authenticated) {
						printFields({ Status: 'not authenticated' })
						printNextSteps([
							'export ASANA_ACCESS_TOKEN=<pat> — https://app.asana.com/0/my-apps',
							'cyber-asana auth login — authorize through OAuth',
						])
						return
					}
					printFields({
						Status: 'authenticated',
						Source: credential.source,
						Token: credential.token ? maskToken(credential.token) : null,
						Ignored: credential.shadowed.length > 0 ? credential.shadowed.join(', ') : null,
					})
				},
			)
		})

	cmd
		.command('login')
		.description('Authorize through OAuth in the browser and store the credentials')
		.option('--no-store', 'Print the token instead of saving it')
		.option('--include-refresh-token', 'Also print the long-lived refresh token (implies --no-store)')
		.option('--raw', 'Print only the token, for shell substitution')
		.option('--scope <list>', 'Comma-separated scopes to request')
		.option('--port <port>', `Callback port (default: ${DEFAULT_CALLBACK_PORT})`)
		.action(
			async (opts: {
				store?: boolean
				includeRefreshToken?: boolean
				raw?: boolean
				scope?: string
				port?: string
			}) => {
				const dir = deps.configDir()
				const app = resolveAppCredentials({ settings: await deps.readSettings(dir) })
				if (!app) throw new Error(REGISTRATION_HELP)

				const tokens = await deps.login({
					app,
					port: opts.port ? Number(opts.port) : DEFAULT_CALLBACK_PORT,
					scopes: parseScopes(opts.scope),
				})

				// Asking for the refresh token only makes sense when printing.
				const store = opts.store !== false && !opts.includeRefreshToken
				if (store) {
					await deps.writeCredentials(dir, tokens)
					output(
						{
							stored: true,
							user: tokens.user ?? null,
							expires_at: new Date(tokens.expiresAt).toISOString(),
						},
						() => {
							printFields({
								Status: 'authorized',
								Account: describeUser(tokens.user),
								Expires: new Date(tokens.expiresAt).toISOString(),
							})
							printNextSteps(['cyber-asana auth status — confirm which credential is in effect'])
						},
					)
					return
				}

				// --no-store puts a live credential on stdout: shell history, CI logs,
				// and agent transcripts all capture it. The access token expires in an
				// hour; the refresh token does not, so it stays behind a second flag.
				if (opts.raw) {
					console.log(tokens.accessToken)
					return
				}
				output(
					{
						access_token: tokens.accessToken,
						refresh_token: opts.includeRefreshToken ? (tokens.refreshToken ?? null) : undefined,
						expires_at: new Date(tokens.expiresAt).toISOString(),
						user: tokens.user ?? null,
					},
					() => {
						printFields({
							Token: tokens.accessToken,
							'Refresh token': opts.includeRefreshToken ? (tokens.refreshToken ?? null) : null,
							Expires: new Date(tokens.expiresAt).toISOString(),
							Account: describeUser(tokens.user),
						})
						printNextSteps(['export ASANA_ACCESS_TOKEN=<token> — use it for the next hour'])
					},
				)
			},
		)

	return cmd
}
