import { execSync } from 'node:child_process'

export interface CommitInfo {
	sha: string
	message: string
	author: string
}

export interface CommitRange {
	baseSha: string
	headSha: string
}

export class CommitIterator {
	// Use a unique delimiter that's extremely unlikely to appear in commit messages
	private readonly DELIMITER = '|||DELIMITER|||'

	constructor(private readonly range: CommitRange) {}

	/**
	 * Retrieve commits from the specified range using git log
	 * @returns Array of commit information
	 */
	getCommits(): CommitInfo[] {
		const { baseSha, headSha } = this.range

		const commits = execSync(`git log --format="%H${this.DELIMITER}%s${this.DELIMITER}%an" ${baseSha}..${headSha}`)
			.toString()
			.trim()
			.split('\n')
			.filter(line => line.length > 0)

		return commits.map(commit => {
			const parts = commit.split(this.DELIMITER)
			// Handle edge case where delimiter might not be present (shouldn't happen with git log)
			if (parts.length !== 3) {
				throw new Error(`Unexpected commit format: ${commit}`)
			}
			const [sha, message, author] = parts
			return { sha, message, author }
		})
	}
}
