import { fetchme } from "./utils/api";

async function main() {
  let sum = add("10", 20); // string + number
  console.log("sum:", sum);

  const user = await fetchme(10); // missing param
  console.log(user);
}

main();
