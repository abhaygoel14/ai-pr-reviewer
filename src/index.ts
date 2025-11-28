import { add } from "./utils/calc";
import { fetchUser } from "./utils/api";

async function main() {
  let sum = add("10", 20); // string + number
  console.log("sum:", sum);

  const user = await fetchUser(); // missing param
  console.log(user);
}

main();
