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

// Get diff (patch) for PR
export async function getPullRequestDiff(
  owner: string,
  repo: string,
  prNumber: number
): Promise<string> {
  const baseUrl = "https://api.github.com";
  const url = `${baseUrl}/repos/${owner}/${repo}/pulls/${prNumber}`;

  const headers: Record<string, string> = {
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

// Post a single overall PR comment (not inline per-line yet)
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
