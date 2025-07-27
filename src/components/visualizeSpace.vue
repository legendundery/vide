<template>
  <a-row>
    <a-col :span="12">
      <a-slider v-model:value="current_step" :min="0" :max="maxKey" />
    </a-col>
    <a-col :span="4">
      <a-input-number
        v-model:value="current_step"
        :min="0"
        :max="maxKey"
        style="margin-left: 16px"
      />
    </a-col>
  </a-row>

  <a-flex v-if="steps" wrap="wrap">
    <template v-for="step in steps" :key="step.key">
      <template v-if="step.key === current_step">
        <a-collapse>
          <a-collapse-panel
            v-for="(cFunc, index) in step.functions"
            :key="index"
            :header="cFunc.function_name"
          >
            <a-collapse>
              <a-collapse-panel
                v-for="(value, index) in cFunc.values"
                :key="index"
                :header="value.name + ' (' + value.type + ')'"
                style="overflow: auto"
              >
                <a-list style="overflow: auto">
                  <a-list-item>
                    <displayValue :value="value.value" />
                  </a-list-item>
                </a-list>
              </a-collapse-panel>
            </a-collapse>
          </a-collapse-panel>
        </a-collapse>
      </template>
    </template>
  </a-flex>
</template>

<script lang="ts" setup>
import { defineProps, defineModel } from "vue";
import type { PropType } from "vue";
import displayValue from "./displayValue.vue";
const current_step = defineModel({
  type: Number,
  default: 1,
});
current_step.value = 0;

type value = string | valueObject | valueArray;

type valueArray = value[];

interface valueObject {
  [key: string]: value;
}

interface valueBase {
  name: string;
  value: value;
  type: string;
  address: string;
}

interface functionsType {
  function_name: string;
  values: valueBase[];
}

//////////////////////////////////////////

interface stepType {
  functions: Array<functionsType>;
  line_number: string;
  key: number;
}
const props = defineProps({
  steps: {
    type: Array as PropType<stepType[]>,
  },
  maxKey: {
    type: Number,
    default: 1,
  },
});
</script>

<style scoped></style>
