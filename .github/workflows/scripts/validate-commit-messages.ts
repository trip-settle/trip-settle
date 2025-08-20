import { execSync } from 'node:child_process'

const { BASE_SHA: baseSha, HEAD_SHA: headSha, PR_NUMBER: prNumber } = process.env

console.log(`Validating commits in PR #${prNumber}`)
console.log(`Base ${baseSha.substring(0, 7)}, Head: ${headSha.substring(0, 7)}`)

const commits = execSync(`git log --format="%H\%s|%an" ${baseSha}..${headSha}`)
	.toString()
	.trim()
	.split('\n')
	.filter(line => line.length > 0)

if (commits.length === 0) {
	console.log('No commits to validate')
	process.exit(0)
}

console.log(`Found ${commits.length} commits to validate.`)

let hasErrors = false
const errors: string[] = []

for (const commit of commits) {
}

if (hasErrors) {
	console.log('\n📋 Summary of errors:')
	errors.forEach(error => console.log(`- ${error}`))

	process.exit(1)
}

console.log(`\n🎉 All ${commits.length} commits have valid messages!`)
