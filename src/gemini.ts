// src/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. Gemini calls will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function generateCodeReview(diff: string): Promise<string> {
  const prompt = `
You are a senior software engineer doing a strict yet practical code review.
You are given a Git diff from a pull request.

Tasks:
- Identify real issues (bugs, potential security issues, performance problems).
- Suggest improvements for readability, maintainability, and best practices.
- Highlight any suspicious patterns or anti-patterns.
- If the diff is mostly fine, say that and only mention important nits.
- Keep the response under about 25-30 lines.
- Use markdown with headings and bullet points.

Here is the diff:
${diff}
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  return text;
}
