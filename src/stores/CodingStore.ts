import { defineStore } from "pinia";
import { ref } from "vue";

export const CodingStore = defineStore("coding-store", () => {
  const code = ref(
    "#include <iostream>\n" +
      "using namespace std;\n" +
      "int func(int n){\n" +
      " if(n>1){\n" +
      " return n*func(n-1);\n" +
      " }\n" +
      " return n;\n" +
      "}\n" +
      "\n" +
      "int main() {\n" +
      "  int a=5;\n" +
      "  int b = func(a);\n" +
      '  printf("%d\\n",b);\n' +
      "  return 0;\n" +
      "}\n"
  );
  const input = ref("");
  const output = ref("");
  return {
    code,
    input,
    output,
  };
});
