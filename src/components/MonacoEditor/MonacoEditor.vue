<template>
  <div ref="codeEditBox" class="code-edit-container"></div>
</template>
<script lang="js">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { editorProps } from "./monacoEditorType.ts";

import * as monaco from "monaco-editor";
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

export default defineComponent({
  name: "MonacoEditor",
  props: editorProps,
  emits: ["update:modelValue", "change", "editor-mounted"],
  setup(props, { emit }) {
    let editor;
    const codeEditBox = ref();
    let monacoInited = false;
    const loadScriptResultMap = {};

    const importMonaco = () => {

      this.MonacoEnvironment = {
        getWorkerUrl: function () {
          return "./editor.worker.bundle.js";
        },
      };

    };
    (self).MonacoEnvironment = {
      getWorker(workerId, label) {
        return new EditorWorker();
        },
    };
    const initMonaco = () => {
          if (codeEditBox.value) {
            let editor = monaco.editor.create(codeEditBox.value, {
              value: props.modelValue,
              language: props.language,
              theme: props.theme,
              ...props.options,
            });
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(
              {
                noSemanticValidation: false,
                noSyntaxValidation: false,
              }
            );
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions(
              {
                target: monaco.languages.typescript.ScriptTarget.ES2020,
                allowNonTsExtensions: true,
              }
            );
            editor.onDidChangeModelContent(() => {
              const value = editor.getValue();
              emit("update:modelValue", value);
              emit("change", value);
            });
            emit("editor-mounted", editor);
            }
    };
    onBeforeUnmount(() => {
      editor.dispose();
    });

    onMounted(() => {
      initMonaco();
    });

    watch(
      () => props.modelValue,
      (newValue) => {
        if (editor) {
          const value = editor.getValue();
          if (newValue !== value) {
            editor.setValue(newValue);
          }
        }
      }
    );

    watch(
      () => props.options,
      (newValue) => {
        editor.updateOptions(newValue);
      },
      { deep: true }
    );

    watch(
      () => props.readOnly,
      () => {
        editor.updateOptions({ readOnly: props.readOnly });
      },
      { deep: true }
    );

    watch(
      () => props.language,
      (newValue) => {
        window.monaco.editor.setModelLanguage(editor.getModel(), newValue);
      }
    );

    return {
      codeEditBox,
    };
  },
});
</script>

<style scoped lang="scss">
.code-edit-container {
  width: 100%;
  flex: 1;
  height: 100%;
  overflow-y: auto;
}
</style>
