<template>
  <div id="windowContent" ref="windowContentRef">
    <div>
      <a-button @click="add">ADD</a-button>
    </div>
    <div id="xuanxiangka">
      <a-tabs
        v-model:activeKey="activeKey"
        hide-add
        type="editable-card"
        @edit="onEdit"
      >
        <a-tab-pane
          v-for="pane in panes"
          :key="pane.key"
          :tab="pane.title"
          :closable="pane.closable"
        >
          <a-row style="height: 400px">
            <codeSpace
              title="Code Space"
              :compile="compile"
              v-model:="pane.codingcontent"
            />
          </a-row>
          <a-row>
            <a-col :span="12">
              <codeSpace title="input" v-model:="pane.inputcontent" />
            </a-col>
            <a-col :span="12">
              <codeSpace title="output" v-model:="pane.outputcontent" />
            </a-col>
          </a-row>
        </a-tab-pane>
      </a-tabs>
    </div>
  </div>
</template>

<script lang="ts" setup>
import codeSpace from "@/components/codeSpace.vue";
import { ref } from "vue";
import { compileCpp } from "../../api/submitCodeOnPlayground";

const currentoutput = ref("");
const currentid = ref(0);

const compile = () => {
  currentid.value = activeKey.value;
  const updateJSON = ref({
    code: panes.value[activeKey.value].codingcontent,
    input: panes.value[activeKey.value].inputcontent,
  });
  console.log(updateJSON);
  console.log(currentid.value);
  console.log(activeKey.value);

  compileCpp(JSON.stringify(updateJSON.value))
    //.then((response) => JSON.parse(response))
    .then((result) => {
      console.log(result);
      currentoutput.value = result.data.output;
      panes.value[currentid.value].outputcontent = currentoutput.value;
      console.log(currentoutput.value);
    })
    .catch((err) => {
      console.log(err);
    });
};

//选项卡

const panes = ref<
  {
    title: string;
    key: number;
    codingcontent: any;
    inputcontent: any;
    outputcontent: any;
    closable?: boolean;
  }[]
>(
  new Array(1).fill(null).map((_, index) => {
    const id = index;
    const codingcontent = ref(`write code here. ${id}`);
    const inputcontent = ref("");
    const outputcontent = ref("");
    return {
      title: `code ${id}`,
      key: id,
      codingcontent: codingcontent,
      inputcontent: inputcontent,
      outputcontent: outputcontent,
    };
  })
);
const activeKey = ref(panes.value[0].key);
//console.log(activeKey.value);
const newTabIndex = ref(0);

const add = () => {
  activeKey.value = ++newTabIndex.value;
  panes.value.push({
    title: `code${activeKey.value}`,
    key: activeKey.value,
    codingcontent: `write code here. ${activeKey.value}`,
    inputcontent: "",
    outputcontent: "",
  });
};

const remove = (targetKey: number) => {
  let lastIndex = 0;
  panes.value.forEach((pane, i) => {
    if (pane.key === targetKey) {
      lastIndex = i - 1;
    }
  });
  panes.value = panes.value.filter((pane) => pane.key !== targetKey);
  if (panes.value.length && activeKey.value === targetKey) {
    if (lastIndex >= 0) {
      activeKey.value = panes.value[lastIndex].key;
    } else {
      activeKey.value = panes.value[0].key;
    }
  }
};

const onEdit = (targetKey: number) => {
  remove(targetKey);
};
</script>
