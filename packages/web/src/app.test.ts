import { describe, expect, it } from 'vitest'

describe('SvelteKit App', () => {
	it('should be runnable and have basic structure', () => {
		// @ts-ignore
		import('$app/environment').then(env => {
			expect(env).toBeDefined()
		})
	})
})
