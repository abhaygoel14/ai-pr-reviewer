// src/github.ts
import fetch from "node-fetch";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // will be set by GitHub Actions token

if (!GITHUB_TOKEN) {
  console.warn("GITHUB_TOKEN is not set. GitHub API calls will fail.");
}

async function githubApi(path: string, options: any = {}) {
  const baseUrl = "https://api.github.com";
  const url = `${baseUrl}${path}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status} on ${path}: ${text}`);
  }
  return res.json();
}

export async function getPullRequestDetails(
  owner: string,
  repo: string,
  prNumber: number
) {
  return githubApi(`/repos/${owner}/${repo}/pulls/${prNumber}`);
}

// Latest commits (to get intent message)
export async function getPRCommits(
  owner: string,
  repo: string,
  prNumber: number
) {
  return githubApi(`/repos/${owner}/${repo}/pulls/${prNumber}/commits`);
}

// Changed files list
export async function getChangedFiles(
  owner: string,
  repo: string,
  prNumber: number
) {
  return githubApi(`/repos/${owner}/${repo}/pulls/${prNumber}/files`);
}

// Diff endpoint
export async function getPullRequestDiff(
  owner: string,
  repo: string,
  prNumber: number
) {
  const baseUrl = "https://api.github.com";
  const url = `${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`;

  const headers = {
    Accept: "application/vnd.github.v3.diff",
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status} getting diff: ${text}`);
  }

  const diff = await res.text();
  return diff;
}

// Post normal PR comment
export async function postPullRequestComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string
) {
  return githubApi(`/repos/${owner}/${repo}/issues/${prNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}
