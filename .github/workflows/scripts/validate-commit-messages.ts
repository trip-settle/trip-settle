import { execSync } from 'node:child_process'
import { readFileSync } from 'fs'
import { parse } from 'yaml'

interface CommitRule {
	name: string
	description: string
	requires_scope: boolean
	scopes?: string[] | Record<string, { description: string }>
	examples?: {
		good?: Array<{ commit: string; explanation: string }>
		bad?: Array<{ commit: string; explanation: string }>
	}
}

interface CommitConfig {
	allowed_keywords: CommitRule[]
	breaking_changes: {
		indicators: string[]
		example: string[]
	}
}

const { BASE_SHA: baseSha, HEAD_SHA: headSha, PR_NUMBER: prNumber } = process.env

if (!baseSha || !headSha) {
	console.error(`BASE_SHA or HEAD_SHA is not set. Got BASE_SHA=${baseSha}, HEAD_SHA=${headSha}`)
	process.exit(2)
}

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
	const [sha, message, author] = commit.split('|', 3)

	const validation = validateCommitMessage(message)

	if (!validation.isValid) {
		hasErrors = true
	} else {
		console.log(`✅ ${sha.substring(0, 7)}: "${message}"`)
	}
}

if (hasErrors) {
	console.log('\n📋 Summary of errors:')
	errors.forEach(error => console.log(`- ${error}`))

	process.exit(1)
}

console.log(`\n🎉 All ${commits.length} commits have valid messages!`)

interface ValidationResult {
	isValid: boolean
	errors: string[]
}

function loadConfig(configPath: string = './commit-convetions.yaml'): CommitConfig {
	try {
		const yamlContent = readFileSync(configPath, 'utf8')
		return parse(yamlContent) as CommitConfig
	} catch (error) {
		console.error(`❌ Failed to load config file: ${error}`)
		process.exit(1)
	}
}

function validateCommitMessage(message: string): ValidationResult {
	const commitRegex = /^([a-z]+)(\(([^)]+)\))?: [A-Z].+$/
	const match = message.match(commitRegex)

	if (!match) {
		errors.push('Invalid format. Expected: "<type>(<scope>): <description>"')
		return { isValid: false, errors }
	}

	return {
		isValid: true,
		errors: [],
	}
}
