import path from 'node:path'
import fs from 'node:fs'
import { debounce } from 'throttle-debounce'
import type { RoutingConfiguration } from '@hybridly/core'
import type { RouterOptions } from '../types'
import { debug } from '../utils'
import { fetchRoutingFromArtisan } from './routes'

export const write = debounce(1000, writeDefinitions, { atBegin: true })

async function writeDefinitions(options: RouterOptions, routing?: RoutingConfiguration) {
	routing ??= await fetchRoutingFromArtisan(options)

	if (options.dts === false || !routing) {
		return
	}

	debug.router('Writing types for routing:', routing)

	const target = path.resolve(options.dts ?? '.hybridly/routes.d.ts')
	const routes = Object.fromEntries(Object.entries(routing!.routes).map(([key, route]) => {
		const bindings = route.bindings
			? Object.fromEntries(Object.entries(route.bindings).map(([key]) => [key, '__key_placeholder__']))
			: undefined

		return [key, {
			...(route.uri ? { uri: route.uri } : {}),
			...(route.domain ? { domain: route.domain } : {}),
			...(route.wheres ? { wheres: route.wheres } : {}),
			...(route.bindings ? { bindings } : {}),
		}]
	}))

	const definitions = generateDefinitions()
		.replace('__URL__', routing?.url ?? '')
		.replace('__ROUTES__', JSON.stringify(routes).replaceAll('"__key_placeholder__"', 'any'))

	fs.mkdirSync(path.dirname(target), { recursive: true })
	fs.writeFileSync(target, definitions, { encoding: 'utf-8' })
}

function generateDefinitions() {
	return `
/* eslint-disable */
/* prettier-ignore */
// This file has been automatically generated by Hybridly
// Modifications will be discarded

declare module 'hybridly' {
	export interface GlobalRouteCollection {
		url: '__URL__'
		routes: __ROUTES__
	}
}

export {}`
}
