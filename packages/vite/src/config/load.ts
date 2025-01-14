import { execSync } from 'node:child_process'
import type { DynamicConfiguration } from '@hybridly/core'
import type { ViteOptions } from '../types'

export async function loadConfiguration(options: ViteOptions): Promise<DynamicConfiguration> {
	try {
		const php = options.php ?? process.env.PHP_EXECUTABLE_PATH ?? 'php'
		const stdout = execSync(`${php} artisan hybridly:config`)
		return JSON.parse(stdout.toString('utf-8'))
	} catch (e) {
		console.error('Could not load configuration from [php artisan].')
		throw e
	}
}
