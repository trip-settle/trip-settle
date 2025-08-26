import { describe, expect, it } from 'vitest'

describe('SvelteKit App', () => {
	it('should be runnable and have basic structure', async () => {
		// @ts-ignore
		const env = await import('$app/environment')
		expect(env).toBeDefined()
	})
})
