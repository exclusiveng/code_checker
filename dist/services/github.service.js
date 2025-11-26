"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRepoUrl = parseRepoUrl;
exports.createBranchCommitAndPR = createBranchCommitAndPR;
const octokit_1 = require("octokit");
const adm_zip_1 = __importDefault(require("adm-zip"));
function parseRepoUrl(repoUrl) {
    // Supports https://github.com/owner/repo or git@github.com:owner/repo.git
    const httpsMatch = repoUrl.match(/github\.com[:\/]([^\/#]+)\/(.+?)(?:\.git)?$/i);
    if (httpsMatch) {
        return { owner: httpsMatch[1], repo: httpsMatch[2] };
    }
    throw new Error('Unsupported GitHub repo URL');
}
async function createBranchCommitAndPR(params) {
    const { token, repo, baseBranch = 'main', branchName, zipPath, prTitle, prBody } = params;
    const octokit = new octokit_1.Octokit({ auth: token });
    // Ensure base ref
    const { data: baseRef } = await octokit.rest.git.getRef({
        owner: repo.owner,
        repo: repo.repo,
        ref: `heads/${baseBranch}`,
    });
    // Create branch (ref)
    const newRef = `refs/heads/${branchName}`;
    await octokit.rest.git.createRef({
        owner: repo.owner,
        repo: repo.repo,
        ref: newRef,
        sha: baseRef.object.sha,
    });
    // Read zip and prepare blobs
    const zip = new adm_zip_1.default(zipPath);
    const entries = zip.getEntries().filter((e) => !e.isDirectory);
    // Create blobs
    const blobs = await Promise.all(entries.map(async (entry) => {
        const content = entry.getData().toString('base64');
        const blob = await octokit.rest.git.createBlob({
            owner: repo.owner,
            repo: repo.repo,
            content,
            encoding: 'base64',
        });
        return { path: entry.entryName, sha: blob.data.sha, mode: '100644', type: 'blob' };
    }));
    // Create tree from blobs based on base tree of baseBranch
    const { data: baseCommit } = await octokit.rest.repos.getCommit({
        owner: repo.owner,
        repo: repo.repo,
        ref: baseBranch,
    });
    const { data: tree } = await octokit.rest.git.createTree({
        owner: repo.owner,
        repo: repo.repo,
        base_tree: baseCommit.commit.tree.sha,
        tree: blobs,
    });
    // Create commit
    const { data: commit } = await octokit.rest.git.createCommit({
        owner: repo.owner,
        repo: repo.repo,
        message: prTitle,
        tree: tree.sha,
        parents: [baseRef.object.sha],
    });
    // Update ref to point to new commit
    await octokit.rest.git.updateRef({
        owner: repo.owner,
        repo: repo.repo,
        ref: `heads/${branchName}`,
        sha: commit.sha,
        force: true,
    });
    // Open PR
    const { data: pr } = await octokit.rest.pulls.create({
        owner: repo.owner,
        repo: repo.repo,
        title: prTitle,
        head: branchName,
        base: baseBranch,
        body: prBody,
    });
    return { prUrl: pr.html_url };
}
