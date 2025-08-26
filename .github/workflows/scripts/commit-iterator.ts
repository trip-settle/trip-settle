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
}
