import fetch from "node-fetch";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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
    ...(options.headers || {})
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status} on ${path}: ${text}`);
  }
  return res.json();
}

// (kept for fallback if you still want overall comments)
export async function postPullRequestComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string
) {
  return githubApi(
    `/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ body })
    }
  );
}

// Get PR details so we can get head SHA
export async function getPullRequestDetails(
  owner: string,
  repo: string,
  prNumber: number
) {
  return githubApi(`/repos/${owner}/${repo}/pulls/${prNumber}`);
}

// Get whole diff (if you still use it for Gemini context)
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
    "X-GitHub-Api-Version": "2022-11-28"
  };

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status} getting diff: ${text}`);
  }

  const diff = await res.text();
  return diff;
}

// 🔴 NEW: create an inline review comment with a suggestion
export async function createInlineReviewComment(
  owner: string,
  repo: string,
  prNumber: number,
  params: {
    commitId: string;
    path: string;
    line: number;
    body: string;
  }
) {
  const { commitId, path, line, body } = params;

  return githubApi(
    `/repos/${owner}/${repo}/pulls/${prNumber}/comments`,
    {
      method: "POST",
      body: JSON.stringify({
        body,
        commit_id: commitId,
        path,
        line,
        side: "RIGHT",       // comment on the “new” side of diff
        subject_type: "line" // inline comment
      })
    }
  );
}