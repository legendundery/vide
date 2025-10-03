import { defineStore } from "pinia";
import { reactive, markRaw, ref } from "vue";

import CodeEditor from "../views/CodingField/CodeEditor.vue";
import CodeInput from "../views/CodingField/CodeInput.vue";
import CodeOutput from "../views/CodingField/CodeOutput.vue";
import sampleVue1 from "../views/sample.vue/sampleVue1.vue";
import sampleVue2 from "../views/sample.vue/sampleVue2.vue";
import sampleVue3 from "../views/sample.vue/sampleVue3.vue";
import sampleVue4 from "../views/sample.vue/sampleVue4.vue";
import LessonPlayTab from "../views/CourseLearning/tabs/LessonPlayTab.vue";
import MaterialsTab from "../views/CourseLearning/tabs/MaterialsTab.vue";
import PreviewTab from "../views/CourseLearning/tabs/PreviewTab.vue";

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
          id: "init-sampleVue1",
          Tabs: "Tab1",
          path: "sampleVue1",
          code: "",
          output: "",
        },
        {
          id: "init-sampleVue4",
          Tabs: "Tab4",
          path: "sampleVue4",
          code: "",
          output: "",
        },
      ],
    },
    {
      id: "ru",
      pages: [
        {
          id: "init-coding-1",
          Tabs: "Coding",
          path: "CodeEditor",
          code: `#include <iostream>\nusing namespace std;\nint main(){\n  cout<<"Hello";\n  return 0;\n}`,
          output: "",
        },
      ],
    },
    {
      id: "rd",
      pages: [
        {
          id: "init-input",
          Tabs: "Input",
          path: "CodeInput",
          code: "",
          output: "",
        },
        {
          id: "init-output",
          Tabs: "Output",
          path: "CodeOutput",
          code: "",
          output: "",
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
    LessonPlayTab: markRaw(LessonPlayTab),
    MaterialsTab: markRaw(MaterialsTab),
    PreviewTab: markRaw(PreviewTab),
  };

  // 全局当前激活的 CodeEditor 标签（跨 leaf 使用，比如 Output 面板需要显示对应输出）
  const activeCodeTabGlobal = ref<any>(null);

  // simple incremental id for new tabs
  let tabCounter = 1;
  let tabUidSeed = 1;
  const genTabName = () => `Tab${Date.now().toString(36)}_${tabCounter++}`;
  const genTabId = (prefix: string) =>
    `${prefix}_${Date.now().toString(36)}_${tabUidSeed++}`;

  function findLeaf(leafId: string) {
    return Leafs.find((l) => l.id === leafId);
  }

  /**
   * Add a new tab to a leaf
   * @param leafId target leaf id
   * @param componentPath component key in ComponentMap
   * @param customLabel optional tab label
   * @returns created tab object
   */
  function addTab(
    leafId: string,
    componentPath: string = "CodeEditor",
    customLabel?: string,
    extra?: any
  ) {
    const leaf = findLeaf(leafId);
    if (!leaf) return null;
    const label = customLabel || genTabName();
    const tab: any = {
      id: genTabId(componentPath.toLowerCase()),
      Tabs: label,
      path: componentPath,
      code: "",
      output: "",
    };
    if (extra) Object.assign(tab, extra);
    leaf.pages.push(tab);
    return tab;
  }

  /**
   * Remove a tab by index (or label) from a leaf. Ensures at least 1 tab remains.
   */
  function removeTab(leafId: string, identifier: number | string) {
    const leaf = findLeaf(leafId);
    if (!leaf) return false;
    if (leaf.pages.length <= 1) return false; // keep at least one
    if (typeof identifier === "number") {
      if (identifier < 0 || identifier >= leaf.pages.length) return false;
      leaf.pages.splice(identifier, 1);
      return true;
    } else {
      const idx = leaf.pages.findIndex((p) => p.Tabs === identifier);
      if (idx === -1) return false;
      leaf.pages.splice(idx, 1);
      return true;
    }
  }

  /** Rename a tab by index */
  function renameTab(leafId: string, index: number, newLabel: string) {
    const leaf = findLeaf(leafId);
    if (!leaf) return false;
    if (index < 0 || index >= leaf.pages.length) return false;
    leaf.pages[index].Tabs = newLabel.trim() || leaf.pages[index].Tabs;
    return true;
  }
  // 确保已有初始化 tab 都有 id
  Leafs.forEach((l) => {
    l.pages.forEach((p) => {
      if (!(p as any).id) {
        (p as any).id = genTabId(p.path.toLowerCase());
      }
    });
  });

  function ensureLessonPlayerTabs() {
    // 使用 leaf 'l'
    const leaf = findLeaf("l");
    if (!leaf) return;
    // 如果已经有 lessonplay 就不重复创建
    if (leaf.pages.some((p) => p.Tabs === "lessonplay")) return;
    leaf.pages.splice(0, leaf.pages.length); // 清空
    addTab("l", "LessonPlayTab", "lessonplay");
    addTab("l", "MaterialsTab", "materials");
    // 广播激活 lessonplay
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("layout-activate-tab", {
          detail: { leafId: "l", label: "lessonplay" },
        })
      );
    }, 0);
  }

  function openPreviewTab(fileInfo: any) {
    const leaf = findLeaf("l");
    if (!leaf) return;
    const labelBase = fileInfo.original || fileInfo.filename;
    const existing = leaf.pages.find((p) => p.Tabs === labelBase);
    if (existing) {
      // 激活已有 tab: 直接把它移到末尾或设置全局引用（此处简单交换顺序可触发 UI 切换）
      if (!(existing as any).code) (existing as any).code = "";
      if (!(existing as any).output) (existing as any).output = "";
      const idx = leaf.pages.findIndex((p) => p.id === existing.id);
      if (idx > -1) {
        const [sp] = leaf.pages.splice(idx, 1);
        leaf.pages.push(sp);
      }
      return existing;
    }
    const payload = {
      code: JSON.stringify({
        url: fileInfo.url,
        mime: fileInfo.mime,
        filename: fileInfo.filename,
        original: fileInfo.original,
        size: fileInfo.size,
      }),
    };
    // 处理同名冲突：若已存在同 label，加 (n) 后缀
    let finalLabel = labelBase;
    let dupIdx = 1;
    while (leaf.pages.some((p) => p.Tabs === finalLabel)) {
      dupIdx += 1;
      finalLabel = `${labelBase}(${dupIdx})`;
    }
    return addTab("l", "PreviewTab", finalLabel, payload);
  }

  return {
    BTREE,
    Leafs,
    ComponentMap,
    addTab,
    removeTab,
    renameTab,
    activeCodeTabGlobal,
    ensureLessonPlayerTabs,
    openPreviewTab,
  };
});
