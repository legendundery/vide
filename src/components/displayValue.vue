<template>
  <template v-if="isArray(value)">
    <template v-for="(sub_value, index) in value" :key="index">
      <displayValue :value="sub_value" />
      <span v-if="!isNaN(Number(sub_value))"> </span>
    </template>
  </template>
  <template v-else-if="isObject(value)">
    <template v-for="(sub_value, key) in value" :key="key">
      <a-collapse>
        <a-collapse-panel :header="key">
          <displayValue :value="sub_value" />
        </a-collapse-panel>
      </a-collapse>
    </template>
  </template>
  <template v-else>
    <a-card-grid>
      <span v-if="Math.floor(Number(value)) !== Number(value)">
        {{ Number(value).toFixed(2) }}
      </span>
      <span v-else>
        {{ value }}
      </span>
    </a-card-grid>
  </template>
</template>

<style>
/* 数组项间距 */
template[v-if="isArray\\(value\\)"] > template {
  display: block;
  margin-bottom: 8px;
}

/* 数值项样式 */
template[v-if="isArray\\(value\\)"]
  span[v-if="!isNaN\\(Number\\(sub_value\\)\\)"] {
  display: inline-block;
  width: 12px;
  color: #9ca3af;
}

/* 对象折叠面板样式 */
a-collapse {
  margin-bottom: 16px;
}

a-collapse-panel {
  border-radius: 4px;
  margin-bottom: 8px;
}

/* 数值显示样式 */
a-card-grid {
  padding: 8px 12px;
  border-radius: 4px;
  background-color: #f9fafb;
  display: inline-block;
}

/* 浮点数样式 */
template[v-else] span:first-of-type {
  color: #1e40af;
  font-weight: 500;
}
</style>

<script lang="ts" setup>
import { defineProps } from "vue";
import type { PropType } from "vue";
import displayValue from "./displayValue.vue";

type value = string | number | valueObject | valueArray;

type valueArray = value[];

interface valueObject {
  [key: string]: value;
}

const props = defineProps({
  value: {
    type: [Object, Array, String, Number, Boolean, null] as PropType<value>,
  },
});

const isArray = (value: any): value is valueArray => Array.isArray(value);
const isObject = (value: any): value is valueObject => {
  return value !== null && typeof value === "object" && !Array.isArray(value);
};
</script>
