import { fetchme } from "./utils/api";

async function main() {
  const a = 10,
    b = 20;
  const user = a + b > 10 ? a + b : 0;
  console.log(user);
}

main();
