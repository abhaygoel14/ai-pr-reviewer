export function parseIntent(msg: string) {
  const parts = msg.split("|").map((p) => p.trim());
  return {
    jira: parts[0] || "",
    app: parts[1] || "",
    feature: parts[2] || "",
    description: parts[3] || "",
  };
}
