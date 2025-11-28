// src/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. Gemini calls will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateCodeReview(
  diff: string,
  intent: any
): Promise<string> {
  const prompt = `
You are a senior code reviewer.

Here is the developer intent:

Jira Ticket: ${intent.jira}
Application: ${intent.app}
Feature: ${intent.feature}
Description: ${intent.description}

You must:
- Understand the business purpose
- Validate whether code changes match this intent
- Identify bugs, risks, mismatches
- Focus only on the changed code
- Return a structured markdown PR review

Your output must follow these strict rules:

1. Keep every explanation **to a single short line** (max 12–15 words).
2. Focus ONLY on:
   - correctness & bug risks
   - performance & async issues
   - error handling
   - null/undefined safety
   - TypeScript best practices
   - naming & readability
   - avoiding anti-patterns
3. Suggestions MUST be shown using **GitHub-readable code diff blocks**:
diff
   - old code
   + new improved code
Here is the PR diff:
${diff}
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return text;
}
