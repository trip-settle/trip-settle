import { execSync } from 'child_process'

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
	constructor(private readonly range: CommitRange) {}

	/**
	 * Retrieve commits from the specified range using git log
	 * @returns Array of commit information
	 */
	getCommits(): CommitInfo[] {
		const { baseSha, headSha } = this.range

		const commits = execSync(`git log --format="%H|%s|%an" ${baseSha}..${headSha}`)
			.toString()
			.trim()
			.split('\n')
			.filter(line => line.length > 0)

		return commits.map(commit => {
			const [sha, message, author] = commit.split('|', 3)
			return { sha, message, author }
		})
	}
}
