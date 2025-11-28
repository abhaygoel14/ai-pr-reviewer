import {
  getPullRequestDiff,
  getPullRequestDetails,
  createInlineReviewComment,
  postPullRequestComment,
} from "./github";
import { generateInlineSuggestions, InlineSuggestion } from "./gemini";

async function main() {
  const repoFull = process.env.GITHUB_REPOSITORY; // e.g. "user/repo"
  const prNumberStr = process.env.PR_NUMBER; // set in workflow

  if (!repoFull || !prNumberStr) {
    console.log("GITHUB_REPOSITORY or PR_NUMBER env not set. Exiting.");
    process.exit(0);
  }

  const splitRepo = repoFull.split("/");
  const owner: string | undefined = splitRepo[0];
  const repo: string | undefined = splitRepo[1];
  const prNumber = parseInt(prNumberStr, 10);

  if (!owner || !repo) {
    console.log(
      "Could not parse owner or repo from GITHUB_REPOSITORY. Exiting."
    );
    process.exit(0);
  }

  console.log(
    `🔍 Running Gemini INLINE AI review for ${owner}/${repo} PR #${prNumber}`
  );

  // 1. Get PR details for commit id
  const pr = (await getPullRequestDetails(owner, repo, prNumber)) as {
    head?: { sha?: string };
    // add other properties if needed
  };
  const commitId = pr.head?.sha;
  if (!commitId) {
    console.log("Could not determine head commit SHA. Exiting.");
    process.exit(0);
  }

  // 2. Get diff as context for Gemini
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

  // Optional: truncate diff to avoid huge prompts
  const MAX_CHARS = 8000;
  let trimmedDiff = diff;
  if (diff.length > MAX_CHARS) {
    trimmedDiff = diff.slice(0, MAX_CHARS) + "\n...diff truncated for AI...\n";
  }

  // 3. Ask Gemini for inline suggestions
  const suggestions: InlineSuggestion[] = await generateInlineSuggestions(
    trimmedDiff
  );

  if (!suggestions.length) {
    console.log("No inline suggestions from Gemini.");
    await postPullRequestComment(
      owner,
      repo,
      prNumber,
      "🤖 Gemini AI Reviewer: I didn't find any concrete inline changes to suggest. Looks good overall! ✅"
    );
    return;
  }

  console.log(`Got ${suggestions.length} inline suggestions from Gemini.`);

  // 4. Create inline comments with GitHub suggestion blocks
  for (const s of suggestions) {
    const body = `${s.reason}

\`\`\`suggestion
${s.suggested}
\`\`\`
`;

    try {
      console.log(`Creating inline comment on ${s.file}:${s.line}`);
      await createInlineReviewComment(owner, repo, prNumber, {
        commitId,
        path: s.file,
        line: s.line,
        body,
      });
    } catch (err) {
      console.error(
        `Failed to create inline comment for ${s.file}:${s.line}:`,
        err
      );
    }
  }

  console.log("✅ Inline Gemini suggestions posted to PR.");
}

main().catch((err) => {
  console.error("Gemini AI review failed:", err);
  process.exit(0);
});
