import { describe, expect, it, vi } from 'vitest'
import { CommitIterator, CommitRange } from './commit-iterator'
import { execSync } from 'node:child_process'

vi.mock('node:child_process', () => ({
	execSync: vi.fn(),
}))

const mockExecSync = vi.mocked(execSync)

describe('CommitIterator', () => {
	// Use the same delimiter as in the implementation
	const DELIMITER = '|||DELIMITER|||'

	describe('constructor', () => {
		it('should create instance with valid range', () => {
			const range: CommitRange = { baseSha: 'abc123', headSha: 'def456' }
			const iterator = new CommitIterator(range)
			expect(iterator).toBeInstanceOf(CommitIterator)
		})
	})

	describe('getCommits', () => {
		it('should parse git log output correctly', () => {
			const mockGitOutput = `sha1${DELIMITER}feat: Add new feature${DELIMITER}John Doe\nsha2${DELIMITER}fix: Fix bug${DELIMITER}Jane Smith`
			mockExecSync.mockReturnValue(Buffer.from(mockGitOutput))

			const range: CommitRange = { baseSha: 'base123', headSha: 'def456' }
			const iterator = new CommitIterator(range)
			const commits = iterator.getCommits()
			expect(commits).toEqual([
				{ sha: 'sha1', message: 'feat: Add new feature', author: 'John Doe' },
				{ sha: 'sha2', message: 'fix: Fix bug', author: 'Jane Smith' },
			])
		})

		it('should filter out empty lines', () => {
			const mockGitOutput = `sha1${DELIMITER}feat: Add new feature${DELIMITER}John Doe\n\nsha2${DELIMITER}fix: Fix bug${DELIMITER}Jane Smith\n\n`
			mockExecSync.mockReturnValue(Buffer.from(mockGitOutput))

			const range: CommitRange = { baseSha: 'base123', headSha: 'def456' }
			const iterator = new CommitIterator(range)
			const commits = iterator.getCommits()

			expect(commits).toHaveLength(2)
			expect(commits[0].sha).toBe('sha1')
			expect(commits[1].sha).toBe('sha2')
		})

		it('should handle commits with pipe characters in message or author', () => {
			const mockGitOutput = `sha1${DELIMITER}feat: Add feature | with pipe${DELIMITER}John | Doe`
			mockExecSync.mockReturnValue(Buffer.from(mockGitOutput))

			const range: CommitRange = { baseSha: 'base123', headSha: 'def456' }
			const iterator = new CommitIterator(range)
			const commits = iterator.getCommits()

			expect(commits).toEqual([
				{
					sha: 'sha1',
					message: 'feat: Add feature | with pipe',
					author: 'John | Doe',
				},
			])
		})

		it('should handle multiple commits with special characters', () => {
			const mockGitOutput = [
				`sha1${DELIMITER}feat: Add | pipe | support${DELIMITER}John | Doe`,
				`sha2${DELIMITER}fix: Fix issue #123 | urgent${DELIMITER}Jane | Smith | Jr.`,
				`sha3${DELIMITER}docs: Update README${DELIMITER}Bob Smith`,
			].join('\n')

			mockExecSync.mockReturnValue(Buffer.from(mockGitOutput))

			const range: CommitRange = { baseSha: 'base123', headSha: 'def456' }
			const iterator = new CommitIterator(range)
			const commits = iterator.getCommits()

			expect(commits).toEqual([
				{ sha: 'sha1', message: 'feat: Add | pipe | support', author: 'John | Doe' },
				{ sha: 'sha2', message: 'fix: Fix issue #123 | urgent', author: 'Jane | Smith | Jr.' },
				{ sha: 'sha3', message: 'docs: Update README', author: 'Bob Smith' },
			])
		})

		it('should throw error for malformed commit format', () => {
			// Missing delimiter - malformed output
			const mockGitOutput = 'sha1|feat: Add feature|John Doe'
			mockExecSync.mockReturnValue(Buffer.from(mockGitOutput))

			const range: CommitRange = { baseSha: 'base123', headSha: 'def456' }
			const iterator = new CommitIterator(range)

			expect(() => iterator.getCommits()).toThrow('Unexpected commit format')
		})

		it('should call git log with correct format and range', () => {
			mockExecSync.mockReturnValue(Buffer.from(''))

			const range: CommitRange = { baseSha: 'abc123', headSha: 'def456' }
			const iterator = new CommitIterator(range)
			iterator.getCommits()

			expect(mockExecSync).toHaveBeenCalledWith(
				`git log --format="%H${DELIMITER}%s${DELIMITER}%an" abc123..def456`
			)
		})

		it('should handle empty commit range', () => {
			mockExecSync.mockReturnValue(Buffer.from(''))

			const range: CommitRange = { baseSha: 'base123', headSha: 'def456' }
			const iterator = new CommitIterator(range)
			const commits = iterator.getCommits()

			expect(commits).toEqual([])
		})
	})
})
