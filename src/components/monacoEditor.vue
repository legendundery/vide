<template>
  <div ref="editor" class="main"></div>
</template>

<script>
import * as monaco from "monaco-editor";

import createSqlCompleter from "./util/sql-completion";

import createJavascriptCompleter from "./util/javascript-completion";

import createCppCompleter from "./util/cpp-completion";

import registerLanguage from "./util/log-language";

import { toRaw } from "vue";

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";

import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";

import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";

import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

const global = {};

const getHints = (model) => {
  let id = model.id.substring(6);

  return (global[id] && global[id].hints) || [];
};

monaco.languages.registerCompletionItemProvider(
  "sql",

  createSqlCompleter(getHints)
);

monaco.languages.registerCompletionItemProvider(
  "javascript",

  createJavascriptCompleter(getHints)
);

monaco.languages.registerCompletionItemProvider(
  "cpp",

  createCppCompleter(getHints)
);

// 解决 js编辑 报错提示EditorSimpleWorker.loadForeignModule问题

self.MonacoEnvironment = {
  getWorker: function (workerId, label) {
    if (label === "json") {
      return new jsonWorker();
    }
    if (label === "css" || label === "scss" || label === "less") {
      return new cssWorker();
    }
    if (label === "html" || label === "handlebars" || label === "razor") {
      return new htmlWorker();
    }
    if (label === "typescript" || label === "javascript") {
      return new tsWorker();
    }
    return new editorWorker();
  },
};

monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

registerLanguage(monaco);

/**

 * monaco options

 * https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.istandaloneeditorconstructionoptions.html

 */

export default {
  props: {
    options: {
      type: Object,

      default() {
        return {};
      },
    },

    modelValue: [String, Object, Array],

    // value: {

    //   type: String,

    //   required: false

    // },

    language: {
      type: String,
    },

    hints: {
      type: Array,

      default() {
        return [];
      },
    },
  },

  name: "MonacoEditor",

  data() {
    return {
      editorInstance: null,

      defaultOptions: {
        theme: "vs",

        fontSize: 14,
      },
    };
  },

  watch: {
    modelValue() {
      if (this.modelValue !== toRaw(this.editorInstance).getValue()) {
        toRaw(this.editorInstance).setValue(this.modelValue);
      }
    },
  },

  mounted() {
    this.initEditor();

    global[toRaw(this.editorInstance)._id] = this;

    window.addEventListener("resize", this.layout);

    // this.layout();
  },

  unmounted() {
    toRaw(this.editorInstance).dispose();

    global[toRaw(this.editorInstance)._id] = null;

    window.removeEventListener("resize", this.layout);
  },

  methods: {
    layout() {
      toRaw(this.editorInstance).layout();
    },

    undo() {
      toRaw(this.editorInstance).trigger("anyString", "undo");

      this.onValueChange();
    },

    redo() {
      toRaw(this.editorInstance).trigger("anyString", "redo");

      this.onValueChange();
    },

    getOptions() {
      let props = { value: this.modelValue, automaticLayout: true };

      this.language !== undefined && (props.language = this.language);

      let options = Object.assign({}, this.defaultOptions, this.options, props);

      return options;
    },

    onValueChange() {
      // this.$emit("input", toRaw(toRaw(this.editorInstance)).getValue() );

      // this.$emit("change", toRaw(toRaw(this.editorInstance)).getValue() );

      this.$emit("update:modelValue", toRaw(this.editorInstance).getValue());
    },

    initEditor() {
      this.MonacoEnvironment = {
        getWorkerUrl: function () {
          return "./editor.worker.bundle.js";
        },
      };

      this.editorInstance = monaco.editor.create(
        this.$refs.editor,

        this.getOptions()
      );

      toRaw(this.editorInstance).onContextMenu((e) => {
        this.$emit("contextmenu", e);
      });

      toRaw(this.editorInstance).onDidChangeModelContent(() => {
        this.onValueChange();
      });

      toRaw(this.editorInstance).addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,

        () => {
          this.$emit("save", toRaw(this.editorInstance).getValue());
        }
      );
    },
  },
};
</script>

<style scoped>
.main :deep(.view-lines *) {
  font-family: Consolas, "Courier New", monospace !important;
}
</style>
