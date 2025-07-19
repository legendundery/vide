import { defineStore } from "pinia";
import { reactive } from "vue";

export const LayOutStore = defineStore("layout-store", () => {
  const BTREE = reactive({
    type: "horizontal",
    first: { type: "leaf", first: "l", second: undefined },
    second: {
      type: "vertical",
      size: 0.8,
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
          path: "../../views/sample.vue/sampleVue1.vue",
        },
        {
          Tabs: "Tab4",
          path: "../../views/sample.vue/sampleVue4.vue",
        },
      ],
    },
    {
      id: "ru",
      pages: [
        {
          Tabs: "Tab2",
          path: "../../views/sample.vue/sampleVue2.vue",
        },
      ],
    },
    {
      id: "rd",
      pages: [
        {
          Tabs: "Tab3",
          path: "../../views/sample.vue/sampleVue3.vue",
        },
      ],
    },
  ]);
  return {
    BTREE,
    Leafs,
  };
});
