import {
  getPullRequestDetails,
  getPRCommits,
  getChangedFiles,
  getPullRequestDiff,
  postPullRequestComment,
} from "./github";

import { parseIntent } from "./intent";
import { generateCodeReview } from "./gemini";

async function main() {
  const repoFull = process.env.GITHUB_REPOSITORY;
  const prNumberStr = process.env.PR_NUMBER;

  if (!repoFull || !prNumberStr) {
    console.log("Missing PR context.");
    process.exit(0);
  }

  const [owner, repo] = repoFull.split("/");
  const prNumber = parseInt(prNumberStr, 10);

  if (!owner || !repo) {
    console.log("Invalid repository format.");
    process.exit(0);
  }

  console.log(`Running Gemini review for PR #${prNumber}`);

  // 1. Get commit intent
  const commits = (await getPRCommits(owner, repo, prNumber)) as Array<{
    commit: { message: string };
  }>;
  const lastCommit =
    commits.length > 0 ? commits[commits.length - 1] : undefined;
  const commitMsg =
    lastCommit && lastCommit.commit && lastCommit.commit.message
      ? lastCommit.commit.message
      : "";
  const intent = parseIntent(commitMsg);

  // 2. Get changed files + make diff subset
  const files = (await getChangedFiles(owner, repo, prNumber)) as Array<{
    filename: string;
    patch: string;
  }>;
  const fullDiff = await getPullRequestDiff(owner, repo, prNumber);

  // Build diff only for changed files
  let filteredDiff = "";
  for (const f of files) {
    filteredDiff += `\nFile: ${f.filename}\n${f.patch}\n`;
  }

  // 3. Generate review
  const review = await generateCodeReview(filteredDiff, intent);

  // 4. Post PR comment
  await postPullRequestComment(
    owner,
    repo,
    prNumber,
    `🤖 **Gemini AI Review**\n\n${review}`
  );

  console.log("Review posted.");
}

main().catch((err) => {
  console.error("Error running review:", err);
  process.exit(0);
});
