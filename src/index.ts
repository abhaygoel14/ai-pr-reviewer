import { fetchme } from "./utils/api";

async function main() {
  const user = await fetchme();
  console.log(user);
}

main();
