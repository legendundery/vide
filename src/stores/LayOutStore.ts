import { defineStore } from "pinia";
import { reactive, markRaw } from "vue";

import CodeEditor from "../views/CodingField/CodeEditor.vue";
import CodeInput from "../views/CodingField/CodeInput.vue";
import CodeOutput from "../views/CodingField/CodeOutput.vue";
import sampleVue1 from "../views/sample.vue/sampleVue1.vue";
import sampleVue2 from "../views/sample.vue/sampleVue2.vue";
import sampleVue3 from "../views/sample.vue/sampleVue3.vue";
import sampleVue4 from "../views/sample.vue/sampleVue4.vue";

export const LayOutStore = defineStore("layout-store", () => {
  const BTREE = reactive({
    type: "horizontal",
    first: { type: "leaf", first: "l", second: undefined },
    second: {
      type: "vertical",
      size: 0.7,
      first: { type: "leaf", first: "ru", second: undefined },
      second: { type: "leaf", first: "rd", second: undefined },
    },
  });
  const Leafs = reactive([
    {
      id: "l",
      pages: [
        {
          Tabs: "Tab1",
          path: "sampleVue1",
        },
        {
          Tabs: "Tab4",
          path: "sampleVue4",
        },
      ],
    },
    {
      id: "ru",
      pages: [
        {
          Tabs: "Coding",
          path: "CodeEditor",
        },
      ],
    },
    {
      id: "rd",
      pages: [
        {
          Tabs: "Input",
          path: "CodeInput",
        },
        {
          Tabs: "Output",
          path: "CodeOutput",
        },
      ],
    },
  ]);
  const ComponentMap = {
    CodeEditor: markRaw(CodeEditor),
    CodeInput: markRaw(CodeInput),
    CodeOutput: markRaw(CodeOutput),
    sampleVue1: markRaw(sampleVue1),
    sampleVue2: markRaw(sampleVue2),
    sampleVue3: markRaw(sampleVue3),
    sampleVue4: markRaw(sampleVue4),
  };
  return {
    BTREE,
    Leafs,
    ComponentMap,
  };
});
