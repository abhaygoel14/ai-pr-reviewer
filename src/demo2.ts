import isEven from "./isEven";

export const runIsEvenDemo = () => isEven(4);

function executeDemo() {
+  console.log("Is 4 even?", runIsEvenDemo());
};
executeDemo();
