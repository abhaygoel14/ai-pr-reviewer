import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is not set. Gemini calls will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export interface InlineSuggestion {
  file: string; // path, e.g. "src/math.ts"
  line: number; // line number in the PR diff on the NEW side
  suggested: string; // replacement code (one or more lines)
  reason: string; // short explanation
}

function parseSuggestions(text: string): InlineSuggestion[] {
  // Try to extract JSON from ```json ... ``` if present
  const jsonBlockMatch = text.match(/```json([\s\S]*?)```/i);
  const jsonText =
    jsonBlockMatch && typeof jsonBlockMatch[1] === "string"
      ? jsonBlockMatch[1].trim()
      : text.trim();

  try {
    const data = JSON.parse(jsonText);
    if (!data || !Array.isArray(data.suggestions)) return [];
    return data.suggestions
      .filter((s: any) => s && s.file && s.line && s.suggested)
      .map(
        (s: any): InlineSuggestion => ({
          file: s.file,
          line: Number(s.line),
          suggested: String(s.suggested),
          reason: s.reason ? String(s.reason) : "Suggested improvement",
        })
      );
  } catch (e) {
    console.warn("Failed to parse Gemini suggestions as JSON:", e);
    return [];
  }
}

export async function generateInlineSuggestions(
  diff: string
): Promise<InlineSuggestion[]> {
  const prompt = `
You are acting as a GitHub inline code review bot.

You are given a unified Git diff for a pull request. You must return up to 5 **precise inline suggestions** in pure JSON.

VERY IMPORTANT RULES:

- Output ONLY JSON, no explanations.
- Shape must be:
  {
    "suggestions": [
      {
        "file": "relative/path/to/file.ts",
        "line": <number>,  // line number in the NEW code as shown on the RIGHT side of the GitHub PR diff
        "suggested": "replacement code here",
        "reason": "short explanation of why this change is better"
      }
    ]
  }
- "suggested" should be valid code that can fully replace the target line(s).
- Use as FEW lines as necessary. Keep suggestions small.
- If there are no meaningful issues, return:
  { "suggestions": [] }

Focus on:
- clear bugs / correctness
- obvious security issues
- performance issues
- strong readability / style improvements

Here is the diff:

${diff}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return parseSuggestions(text);
}
