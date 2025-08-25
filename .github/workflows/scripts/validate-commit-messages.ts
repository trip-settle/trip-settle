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

const commits = execSync(`git log --format="%H|%s|%an" ${baseSha}..${headSha}`)
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

const config = loadConfig()

for (const commit of commits) {
	const [sha, message, author] = commit.split('|', 3)

	const validation = validateCommitMessage(message, config)

	if (!validation.isValid) {
		const shortSha = sha.substring(0, 7)
		console.error(`❌ ${shortSha}: "${message}" by ${author}`)
		validation.errors.forEach(error => {
			console.error(`   - ${error}`)
			errors.push(`${shortSha}: ${error}`)
		})
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

function loadConfig(configPath: string = './commit-conventions.yaml'): CommitConfig {
	try {
		const yamlContent = readFileSync(configPath, 'utf8')
		return parse(yamlContent) as CommitConfig
	} catch (error) {
		console.error(`❌ Failed to load config file: ${error}`)
		process.exit(1)
	}
}

function validateCommitMessage(message: string, config: CommitConfig): ValidationResult {
	const errors: string[] = []
	// @ts-ignore - suppresses the next line
	const commitRegex = /^(?<type>[a-z]+)(\((?<scope>[^)]+)\))?: (?<description>.+)$/
	const match = message.match(commitRegex)

	if (!match) {
		errors.push('Invalid format. Expected: "<type>(<scope>): <description>"')
		return { isValid: false, errors }
	}

	const { type, scope, description } = match.groups!

	// Check if type is allowed
	const allowedRule = config.allowed_keywords.find(rule => rule.name === type)
	if (!allowedRule) {
		const allowedTypes = config.allowed_keywords.map(rule => rule.name).join(', ')
		errors.push(`Invalid type '${type}'. Allowed types: ${allowedTypes}`)
		return { isValid: false, errors }
	}

	// Check scope requirement
	if (allowedRule.requires_scope && !scope) {
		errors.push(`Type '${type}' requires a scope`)
	}

	// Check if scope is valid (if provided and rule has defined scopes)
	if (scope && allowedRule.scopes) {
		let validScopes: string[] = []

		// Todo Scope 가 배열에서 키로 모두 바뀌면 수정
		if (Array.isArray(allowedRule.scopes)) {
			validScopes = allowedRule.scopes
		} else {
			validScopes = Object.keys(allowedRule.scopes)
		}

		if (validScopes.length > 0 && !validScopes.includes(scope)) {
			errors.push(`Invalid scope '${scope}' for type '${type}'. Allowed scopes: ${validScopes.join(', ')}`)
		}
	}

	// Check if description starts with a capital letter
	if (description && !/^[A-Z]/.test(description.trim())) {
		errors.push('Description must start with a capital letter')
	}

	return {
		isValid: errors.length === 0,
		errors,
	}
}
