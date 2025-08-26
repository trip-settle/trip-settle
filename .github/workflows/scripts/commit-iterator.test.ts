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
	})
})
