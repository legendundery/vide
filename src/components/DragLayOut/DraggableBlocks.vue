<template>
  <div class="sampleHeader" :id="BlockId + '-header'">
    <draggable
      :list="TabsArr"
      ghost-class="ghost"
      handle=".move"
      filter=".forbid"
      :force-fallback="true"
      chosen-class="chosenClass"
      @start="onStart"
      @end="onEnd"
      :group="TabsBlock"
      :fallback-class="true"
      item-key="id"
      style="height: 100%"
    >
      <template #item="{ element }">
        <div class="move item">
          <n-flex justify="space-between">
            <draggable
              style="display: inline"
              :list="GetTabs(element.id)"
              ghost-class="ghost"
              handle=".move"
              filter=".forbid"
              :force-fallback="true"
              chosen-class="chosenClass"
              animation="300"
              @start="onStartTab"
              @end="onEndTab"
              :group="{
                name: 'tabsgroup',
                pull: 'false',
                put: 'false',
              }"
              :fallback-class="true"
              :fallback-on-body="true"
              :touch-start-threshold="25"
              :fallback-tolerance="25"
              :move="onMove"
              :sort="true"
              item-key="id"
            >
              <template #item="{ element }">
                <n-button
                  class="tab move"
                  @click="currentTab = LayoutStore.ComponentMap[element.path]"
                >
                  {{ element.Tabs }}
                </n-button>
              </template>
            </draggable>
            <span :id="BlockId + '-suffix'" class="forbid"></span>
          </n-flex>
        </div>
      </template>
    </draggable>
  </div>
  <div class="sampleBlock" :id="BlockId + '-block'">
    <component :is="currentTab" v-bind="{ currentId: BlockId }"></component>
  </div>
  <Teleport to="body">
    <div class="previewBlock" v-if="preview" :style="previewStyle"></div>
  </Teleport>
</template>

<script lang="js" setup>
import { LayOutStore } from "../../stores/LayOutStore";

import { reactive, ref, toRaw, toRef, toRefs, onMounted, defineAsyncComponent, shallowRef, KeepAlive } from "vue";
import { NFlex, NButton } from "naive-ui";
import draggable from "vuedraggable";

const LayoutStore = LayOutStore();

const props = defineProps({
    BlockId:{
        type: String,
    },
})

const TabsArr = ref([
  {
    id: props.BlockId,
  },
]);

const currentTab = shallowRef();


onMounted(()=>{

  const defaultTab = GetTabs(props.BlockId)[0];

 /*
  currentTab.value = defineAsyncComponent(()=>
    import( defaultTab.path)
  );
  */
  currentTab.value = (LayoutStore.ComponentMap[defaultTab.path])
});


const TabsBlock = ref({
  name: "tabs-block",
  put: false,
  pull: false,
});

const preview = ref(false);
const previewStyle = reactive({
    'opacity': 0.5,
    'background-color': '#E2EAF4',
    'position': 'absolute',
    'border-radius': '10px',
    'border': 'solid blue',
    'pointer-events': 'none',
    'transition': '0.3s',
    'width': '0',
    'height': '0',
    'left': '0',
    'top': '0',
})

const GetTabs = (id)=>{
  for(var i = 0; i < LayoutStore.Leafs.length; i++){
    if(id === LayoutStore.Leafs[i].id){
      return LayoutStore.Leafs[i].pages;
    }
  }
  return [];
}

var targetFrom = 0, targetTo = '', targetMethod = '';
var BlockIdCopy = props.BlockId;

const BlocksMouseMove = (e, flag = false) =>{
    //console.log('debug')

    const TargetBlock = e.currentTarget;
    const rect = TargetBlock.getBoundingClientRect();

    const rectWidth = rect.right - rect.left;
    const rectHeight = rect.bottom - rect.top + 40;

    const rectLeft = rect.left;
    const rectTop = rect.top - (40 + 4);
    const rectBottom = rect.bottom;
    const rectRight = rect.right;

    const currentX = e.clientX;
    const currentY = e.clientY;

    if((TargetBlock.id === props.BlockId + '-block' && !flag)||
      ((currentY <= rectBottom - rectHeight/4)
    &&(currentY >= rectBottom - 3*rectHeight/4)
    &&(currentX >= rectLeft + rectWidth/4)
    &&(currentX <= rectLeft + 3*rectWidth/4)
    )){
        previewStyle.width = (rectWidth - 8) + 'px';
        previewStyle.height = (rectHeight - 8) + 'px';
        previewStyle.left = (rectLeft + 4) + 'px';
        previewStyle.top = (rectTop + 4) + 'px';

        targetTo = TargetBlock.id.slice(0,-6);
        targetMethod = 'center';

        preview.value = true;
        return ;
    }
    preview.value = false;

    const flaglu = ((currentX - rectLeft)/rectWidth + (currentY - rectTop)/rectHeight) <= 1;
    const flagru = ((currentX - rectLeft)/rectWidth - (currentY - rectTop)/rectHeight) >= 0;

    if(flaglu&&flagru){
        previewStyle.width = (rectWidth - 8) + 'px';
        previewStyle.height = (rectHeight/2 - 8) + 'px';
        previewStyle.left = (rectLeft + 4) + 'px';
        previewStyle.top = (rectTop + 4) + 'px';

        targetTo = TargetBlock.id.slice(0,-6);
        targetMethod = 'u';

        preview.value = true;
        return ;
    }else if((!flaglu)&&(!flagru)){
        previewStyle.width = (rectWidth - 8) + 'px';
        previewStyle.height = (rectHeight/2 - 8) + 'px';
        previewStyle.left = (rectLeft + 4) + 'px';
        previewStyle.top = (rectTop + rectHeight/2 + 4) + 'px';

        targetTo = TargetBlock.id.slice(0,-6);
        targetMethod = 'd';

        preview.value = true;
        return ;
    }else if(flaglu&&(!flagru)){
        previewStyle.width = (rectWidth/2 - 8) + 'px';
        previewStyle.height = (rectHeight - 8) + 'px';
        previewStyle.left = (rectLeft + 4) + 'px';
        previewStyle.top = (rectTop + 4) + 'px';

        targetTo = TargetBlock.id.slice(0,-6);
        targetMethod = 'l';

        preview.value = true;
        return ;
    }else{
        previewStyle.width = (rectWidth/2 - 8) + 'px';
        previewStyle.height = (rectHeight - 8) + 'px';
        previewStyle.left = (rectLeft + rectWidth/2 + 4) + 'px';
        previewStyle.top = (rectTop + 4) + 'px';

        targetTo = TargetBlock.id.slice(0,-6);
        targetMethod = 'r';

        preview.value = true;
        return ;
    }

    preview.value = false;
}

const HeaderMouseMove = (e) =>{
    const TargetBlock = e.currentTarget;
    const rect = TargetBlock.getBoundingClientRect();

    const rectWidth = rect.right - rect.left;
    const rectHeight = rect.bottom - rect.top;

    const rectLeft = rect.left;
    const rectTop = rect.top;
    const rectBottom = rect.bottom;
    const rectRight = rect.right;

    previewStyle.width = (rectWidth - 8) + 'px';
    previewStyle.height = (rectHeight - 8) + 'px';
    previewStyle.left = (rectLeft + 4) + 'px';
    previewStyle.top = (rectTop) + 'px';

    targetTo = TargetBlock.id.slice(0,-7);
    targetMethod = 'header';

    preview.value = true;
}

const MoveNode = (from, to, method)=>{
  DeleteNode(from);
  initBTREE();
  if((from.length === 1)||(from[from.length-2] === to[from.length-2])){
    to = to.slice(0,from.length-1) + to.slice(from.length);
  }
  AddNode(from, to, method);
}

const GetNode = (position) =>{
  if(position.length < 1)return toRef(LayoutStore.BTREE);
  var node = LayoutStore.BTREE;
  for(var i = 0; i < position.length - 1; i++){
    node = (position[i]==='l'||position[i]==='u') ? node['first'] : node['second'];
  }
  return toRef(node,(position[position.length-1]==='l'||position[position.length-1]==='u') ? 'first' : 'second');
}

const DeleteNode = (from) =>{
  if(from.length < 1)return ;

  if(from.length === 1){
    const fatherNode = LayoutStore.BTREE;
    const nearNode = (from[0]==='l'||from[0]==='u') ? fatherNode.second : fatherNode.first;

    LayoutStore.BTREE = nearNode;

    for(var i = 0; i < LayoutStore.Leafs.length; i ++){
        if(LayoutStore.Leafs[i].id === from){
          LayoutStore.Leafs[i].id = 'tmp';
        }
    }
  }else{
    const fatherNode = GetNode(from.slice(0,-1));
    const nearNode = toRef(fatherNode.value ,(from[from.length-1]==='l'||from[from.length-1]==='u') ? 'second' : 'first');

    fatherNode.value = nearNode.value;

    for(var i = 0; i < LayoutStore.Leafs.length; i ++){
        if(LayoutStore.Leafs[i].id === from){
          LayoutStore.Leafs[i].id = 'tmp';
        }
    }

  }
}

const initBTREE = ()=>{
  var query = [];
  query.push({
    tree: (LayoutStore.BTREE),
    path: '',
  });
  while(query.length > 0){
    var tmpNode = query.pop();
    if(tmpNode.tree.type === 'leaf'){
      for(var i = 0; i < LayoutStore.Leafs.length; i ++){
        if(LayoutStore.Leafs[i].id === tmpNode.tree.first){
          if(LayoutStore.Leafs[i].id === props.BlockId){
            BlockIdCopy = tmpNode.path;
          }
          LayoutStore.Leafs[i].id = tmpNode.path;
        }
      }
      tmpNode.tree.first = tmpNode.path;
    }else if(tmpNode.tree.type === 'horizontal'){
      query.push({
        tree: tmpNode.tree.first,
        path: tmpNode.path + 'l',
      });
      query.push({
        tree: tmpNode.tree.second,
        path: tmpNode.path + 'r',
      })
    }else if(tmpNode.tree.type === 'vertical'){
      query.push({
        tree: tmpNode.tree.first,
        path: tmpNode.path + 'u',
      });
      query.push({
        tree: tmpNode.tree.second,
        path: tmpNode.path + 'd',
      })
    }
  }
}

const AddNode = (from, to, method) =>{
  const toNode = GetNode(to);

  switch(method){
    case 'center':case 'header':
      var fromTabs;
      for(var i = 0; i < LayoutStore.Leafs.length; i++){
        if(LayoutStore.Leafs[i].id == 'tmp'){
          fromTabs = LayoutStore.Leafs[i].pages;
        }
      }

      for(var i = 0; i < LayoutStore.Leafs.length; i++){
        if(LayoutStore.Leafs[i].id === to){
          LayoutStore.Leafs[i].pages = LayoutStore.Leafs[i].pages.concat(fromTabs);
        }
      }

      LayoutStore.Leafs = LayoutStore.Leafs.filter((leaf)=>leaf.id !== 'tmp')

      break;
    case 'l':
      var tmpNode = {
        type: 'horizontal',
        first: {
          type: 'leaf',
          first: 'tmp',
          second:undefined,
        },
        second:toRaw(toNode.value),
      }
        toNode.value = tmpNode;
      if(to.length < 1) LayoutStore.BTREE = toNode;
      initBTREE();
      break;
    case 'u':
      var tmpNode = {
        type: 'vertical',
        first: {
          type: 'leaf',
          first: 'tmp',
          second:undefined,
        },
        second:toRaw(toNode.value),
      }
        toNode.value = tmpNode;
      if(to.length < 1) LayoutStore.BTREE = toNode;
      initBTREE();
      break;
    case 'r':
      var tmpNode = {
        type: 'horizontal',
        first: toRaw(toNode.value),
        second:{
          type: 'leaf',
          first: 'tmp',
          second:undefined,
        },
      }
        toNode.value = tmpNode;
      if(to.length < 1) LayoutStore.BTREE = toNode;

      initBTREE();
      break;
    case 'd':
      var tmpNode = {
        type: 'vertical',
        first: toRaw(toNode.value),
        second:{
          type: 'leaf',
          first: 'tmp',
          second:undefined,
        },
      }
        toNode.value = tmpNode;
      if(to.length < 1) LayoutStore.BTREE = toNode;

      initBTREE();
      break;
  }
}

const onStart = () => {
    LayoutStore.Leafs.forEach((leaf)=>{
        document.getElementById(leaf.id+'-block').addEventListener('mousemove',BlocksMouseMove)
        document.getElementById(leaf.id+'-header').addEventListener('mousemove',HeaderMouseMove)
  });
};

const onEnd = () => {
    preview.value = false;
    LayoutStore.Leafs.forEach((leaf)=>{
        document.getElementById(leaf.id+'-block').removeEventListener('mousemove',BlocksMouseMove)
        document.getElementById(leaf.id+'-header').removeEventListener('mousemove',HeaderMouseMove)
    });
    if(targetTo !== props.BlockId){
      MoveNode(props.BlockId, targetTo, targetMethod)
    }
};

const BlocksMouseMoveTabs = (event)=>{
  BlocksMouseMove(event,true)
}
const HeaderMouseMoveTabs = (event)=>{
  HeaderMouseMove(event)
}

const onStartTab = (e) => {
  targetFrom = e.oldIndex;
  LayoutStore.Leafs.forEach((leaf)=>{
        document.getElementById(leaf.id+'-block').addEventListener('mousemove',BlocksMouseMoveTabs)
        document.getElementById(leaf.id+'-header').addEventListener('mousemove',HeaderMouseMoveTabs)
  });
};

const onEndTab = () => {
    preview.value = false;
    LayoutStore.Leafs.forEach((leaf)=>{
        document.getElementById(leaf.id+'-block').removeEventListener('mousemove',BlocksMouseMoveTabs)
        document.getElementById(leaf.id+'-header').removeEventListener('mousemove',HeaderMouseMoveTabs)
    });

    //targetTo !== props.BlockId
    if(true){
      if((GetTabs(BlockIdCopy)).length === 1 && targetTo == props.BlockId){
        return;
      }

      const toNode = GetNode(targetTo);

      var tmpTab;
      for(var i = 0; i < LayoutStore.Leafs.length; i++){
        if(LayoutStore.Leafs[i].id === props.BlockId){
          tmpTab = LayoutStore.Leafs[i].pages[targetFrom];
          LayoutStore.Leafs[i].pages = LayoutStore.Leafs[i].pages.filter((_, index)=> index != targetFrom)
        }
      }

      switch(targetMethod){
        case 'center':case 'header':

          for(var i = 0; i < LayoutStore.Leafs.length; i++){
            if(LayoutStore.Leafs[i].id === targetTo){
              LayoutStore.Leafs[i].pages.push(tmpTab);
            }
          }

          LayoutStore.Leafs = LayoutStore.Leafs.filter((leaf)=>leaf.id !== 'tmp')

          break;
        case 'l':
          var tmpNode = {
            type: 'horizontal',
            first: {
              type: 'leaf',
              first: 'tmp',
              second:undefined,
            },
            second:toRaw(toNode.value),
          }
            toNode.value = tmpNode;
          if(targetTo.length < 1 ) LayoutStore.BTREE = toNode;

          LayoutStore.Leafs.push({
            id:'tmp',
            pages:[tmpTab]
          })
          initBTREE();
          break;
        case 'u':
      var tmpNode = {
        type: 'vertical',
        first: {
          type: 'leaf',
          first: 'tmp',
          second:undefined,
        },
        second:toRaw(toNode.value),
      }
        toNode.value = tmpNode;
      if(targetTo.length < 1) LayoutStore.BTREE = toNode;

      LayoutStore.Leafs.push({
        id:'tmp',
        pages:[tmpTab]
      })
      initBTREE();
      break;
        case 'r':
      var tmpNode = {
        type: 'horizontal',
        first: toRaw(toNode.value),
        second:{
          type: 'leaf',
          first: 'tmp',
          second:undefined,
        },
      }
        toNode.value = tmpNode;
      if(targetTo.length < 1) LayoutStore.BTREE = toNode;

      LayoutStore.Leafs.push({
        id:'tmp',
        pages:[tmpTab]
      })
      initBTREE();
      break;
        case 'd':
      var tmpNode = {
        type: 'vertical',
        first: toRaw(toNode.value),
        second:{
          type: 'leaf',
          first: 'tmp',
          second:undefined,
        },
      }
        toNode.value = tmpNode;
      if(targetTo.length < 1) LayoutStore.BTREE = toNode;

      LayoutStore.Leafs.push({
        id:'tmp',
        pages:[tmpTab]
      })
      initBTREE();
      break;
        }

    if((GetTabs(BlockIdCopy)).length === 0){
      DeleteNode(props.BlockId);
      initBTREE();
      LayoutStore.Leafs = LayoutStore.Leafs.filter((leaf)=>leaf.id !== 'tmp')
    }else if(targetTo !== props.BlockId){
      const defaultTab = GetTabs(props.BlockId)[0];
      /* @vite-ignore */
      currentTab.value = defineAsyncComponent(()=>
        import( defaultTab.path)
      );
    }

  }
};

const onMove = (e, originalEvent) => {
  if (e.relatedContext.element.disabledPark == true) return false;
  return true;
};
</script>

<style scoped lang="scss">
.sampleHeader {
  background-color: #efefef7b;
  width: 100%;
  height: 40px;
}
.sampleBlock {
  background-color: #efefef;
  width: 100%;
  height: calc(100% - 40px);
}

.item {
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  border-radius: 10px;
  margin: 4px;
}
.tab {
  width: auto;
  height: 100%;

  padding: 5px;
}
.ghost {
  border: solid 1px rgb(19, 41, 239) !important;
}
.chosenClass {
  opacity: 1;
  border: solid 1px red;
}
.fallbackClass {
  background-color: aquamarine;
}
</style>
