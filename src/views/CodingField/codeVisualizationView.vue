<template>
  <div style="height: 100%; width: 100%">
    <MySplit>
      <template #left>
        <a-row style="height: 60%">
          <codeSpace title="Code Space" :compile="visualize" v-model:="code" />
        </a-row>
        <a-row>
          <a-col :span="12">
            <codeSpace title="input" v-model:="input" />
          </a-col>
          <a-col :span="12">
            <codeSpace title="output" v-model:="output" />
          </a-col> </a-row
      ></template>
      <template #right>
        <visualizeSpace :steps="steps" :max-key="steps.length" />
      </template>
    </MySplit>
  </div>
</template>

<script lang="ts" setup>
import MySplit from "../../components/LnFLayOut.vue";
import codeSpace from "../../components/codeSpace.vue";
import visualizeSpace from "../../components/visualizeSpace.vue";

import { ref } from "vue";
import { debugCpp } from "../../api/submitCodeOnPlayground";

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
const steps = ref([]);

const updateJSON = ref({
  code: code,
  input: input,
});
const visualize = () => {
  debugCpp(JSON.stringify(updateJSON.value))
    //.then((response) => JSON.parse(response))
    .then((result) => {
      output.value = result.data.output;
      steps.value = result.data.steps;
    })
    .catch((err) => {
      console.log(err);
    });
};
</script>
