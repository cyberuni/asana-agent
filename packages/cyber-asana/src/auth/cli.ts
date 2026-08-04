import { Command } from 'commander'
import { getTokenOverride } from '../client.js'
import { output, printFields, printNextSteps } from '../output.js'
import { type Credential, maskToken, resolveCredential } from './credential.js'

// A credential diagnostic that works when the credential does not — `user me`
// answers "who am I to Asana?" and needs a working token to answer at all.
// This answers "what will this process authenticate with?", so it must stay
// local and must not treat "no credentials" as a failure.

function currentCredential(): Credential {
	return resolveCredential({ tokenOverride: getTokenOverride() })
}

export function authCommand(readCredential: () => Credential = currentCredential) {
	const cmd = new Command('auth').description('Inspect and manage Asana credentials')

	cmd.addHelpText(
		'after',
		[
			'',
			'Examples:',
			'  cyber-asana auth status',
			'  cyber-asana auth status --toon',
			'',
			'Every subcommand supports --help for its own options.',
		].join('\n'),
	)

	cmd
		.command('status')
		.description('Show which credential this CLI will use, without calling the Asana API')
		.action(() => {
			const credential = readCredential()
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
							'cyber-asana --token <pat> <command> — authenticate a single invocation',
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

	return cmd
}
