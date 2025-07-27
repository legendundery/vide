<template>
  <a-row style="height: 60%">
    <codeSpace title="Code Space" :compile="compile" v-model:="code" />
  </a-row>
  <a-row>
    <a-col :span="12">
      <codeSpace title="input" v-model:="input" />
    </a-col>
    <a-col :span="12">
      <codeSpace title="output" v-model:="output" />
    </a-col>
  </a-row>
</template>

<script lang="ts" setup>
import codeSpace from "@/components/codeSpace.vue";
import { ref } from "vue";
import { compileCpp } from "@/api/submitCodeOnPlayground";

const code = ref();
const input = ref("");
const output = ref("");

const updateJSON = ref({
  code: code,
  input: input,
});
const compile = () => {
  compileCpp(JSON.stringify(updateJSON.value))
    //.then((response) => JSON.parse(response))
    .then((result) => {
      output.value = result.data.output;
    })
    .catch((err) => {
      console.log(err);
    });
};
</script>
