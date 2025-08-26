import { describe, expect, it, vi } from 'vitest'
import { CommitIterator, CommitRange } from './commit-iterator'
import { execSync } from 'node:child_process'

vi.mock('node:child_process', () => ({
	execSync: vi.fn(),
}))

const mockExecSync = vi.mocked(execSync)

describe('CommitIterator', () => {
	describe('constructor', () => {
		it('should create instance with valid range', () => {
			const range: CommitRange = { baseSha: 'abc123', headSha: 'def456' }
			const iterator = new CommitIterator(range)
			expect(iterator).toBeInstanceOf(CommitIterator)
		})
	})

	describe('getCommits', () => {
		it('should parse git log output correctly', () => {
			const mockGitOutput = 'sha1|feat: Add new feature|John Doe\nsha2|fix: Fix bug|Jane Smith'
			mockExecSync.mockReturnValue(Buffer.from(mockGitOutput))

			const range: CommitRange = { baseSha: 'base123', headSha: 'def456' }
			const iterator = new CommitIterator(range)
			const commits = iterator.getCommits()
		})

		it('should filter out empty lines', () => {
			const mockGitOutput = 'sha1|feat: Add new feature|John Doe\n\nsha2|fix: Fix bug|Jane Smith\n\n'
			mockExecSync.mockReturnValue(Buffer.from(mockGitOutput))

			const range: CommitRange = { baseSha: 'base123', headSha: 'def456' }
			const iterator = new CommitIterator(range)
			const commits = iterator.getCommits()

			expect(commits).toHaveLength(2)
			expect(commits[0].sha).toBe('sha1')
			expect(commits[1].sha).toBe('sha2')
		})

		it('should handle commits with pipe characters in message or author', () => {
			const mockGitOutput = 'sha1|feat: Add feature | with pipe|John | Doe'
			mockExecSync.mockReturnValue(Buffer.from(mockGitOutput))

			const range: CommitRange = { baseSha: 'base123', headSha: 'def456' }
			const iterator = new CommitIterator(range)
			const commits = iterator.getCommits()

			expect(commits).toEqual([{ sha: 'sha1', message: 'feat: Add feature | with pipe', author: 'John | Doe' }])
		})
	})
})
