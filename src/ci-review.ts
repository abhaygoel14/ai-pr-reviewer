// src/ci-review.ts
import { getPullRequestDiff, postPullRequestComment } from "./github";
import { generateCodeReview } from "./gemini";

async function main() {
  const repoFull = process.env.GITHUB_REPOSITORY; // e.g. "user/repo"
  const prNumberStr = process.env.PR_NUMBER; // we'll set this in workflow

  if (!repoFull || !prNumberStr) {
    console.log("GITHUB_REPOSITORY or PR_NUMBER env not set. Exiting.");
    process.exit(0);
  }

  const [owner, repo] = repoFull.split("/");
  if (!owner || !repo) {
    console.log("Invalid GITHUB_REPOSITORY format. Exiting.");
    process.exit(0);
  }
  const prNumber = parseInt(prNumberStr, 10);

  console.log(
    `🔍 Running Gemini AI review for ${owner}/${repo} PR #${prNumber}`
  );

  // 1. Get diff
  const diff = await getPullRequestDiff(owner, repo, prNumber);

  if (!diff || diff.trim().length === 0) {
    console.log("No diff content. Skipping AI review.");
    await postPullRequestComment(
      owner,
      repo,
      prNumber,
      "🤖 Gemini AI Reviewer: I couldn't detect any changes in this PR."
    );
    return;
  }

  // Optionally truncate to avoid huge payloads
  const MAX_CHARS = 8000;
  let trimmedDiff = diff;
  if (diff.length > MAX_CHARS) {
    trimmedDiff = diff.slice(0, MAX_CHARS) + "\n...diff truncated for AI...\n";
  }

  // 2. Call Gemini
  const review = await generateCodeReview(trimmedDiff);

  // 3. Post comment on PR
  const body = `🤖 **Gemini AI Code Review**

${review}`;

  await postPullRequestComment(owner, repo, prNumber, body);

  console.log("✅ Gemini AI review posted to PR.");
}

main().catch((err) => {
  console.error("Gemini AI review failed:", err);
  // Don't fail the CI by default
  process.exit(0);
});
