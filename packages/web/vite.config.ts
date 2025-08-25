// tsconfig 를 사용하지 않아 발생하는 에러
// @ts-ignore
import { sveltekit } from '@sveltejs/kit/vite'

export default {
	plugins: [sveltekit()],
}
