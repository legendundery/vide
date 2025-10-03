<template>
  <div class="sampleHeader" :id="BlockId + '-header'">
    <div class="tabs-bar">
      <div class="tabs-scroll">
        <draggable
          class="tabs-draggable"
          :list="visibleTabs"
          ghost-class="ghost"
          handle=".move"
          filter=".forbid"
          :force-fallback="true"
          chosen-class="chosenClass"
          animation="300"
          @start="onStartTab"
            @end="onEndTab"
          :group="{ name:'tabsgroup', pull:'false', put:'false' }"
          :fallback-class="true"
          :fallback-on-body="true"
          :touch-start-threshold="25"
          :fallback-tolerance="25"
          :move="onMove"
          :sort="true"
          :item-key="tabKeyFn"
        >
          <template #item="{ element, index }">
            <div class="tab-wrapper" @dblclick="startRename(index)">
              <template v-if="renameIndex === index">
                <input
                  ref="renameInputRef"
                  class="rename-input"
                  v-model="renameText"
                  @keyup.enter="confirmRename(index)"
                  @blur="confirmRename(index)"
                  @keyup.esc="cancelRename"
                />
              </template>
              <template v-else>
                <n-button
                  class="tab move"
                  tertiary
                  size="tiny"
                  @click="activateTab(element, BlockId)"
                  :type="isActive(element) ? 'primary' : 'default'"
                >{{ element.Tabs }}</n-button>
              </template>
              <n-button
                v-if="canClose(BlockId)"
                size="tiny"
                quaternary
                class="close-btn"
                @click.stop="closeVisible(index, element)"
              >x</n-button>
            </div>
          </template>
        </draggable>
      </div>
      <div class="actions-cluster forbid">
        <n-button v-if="showMore" size="tiny" tertiary class="more-btn" @click.stop="toggleMore">···</n-button>
        <n-button
          v-if="isCodeEditorActive"
          size="tiny"
          tertiary
          class="compile-btn"
          :disabled="compilingFlag"
          @click="triggerCompile"
        >Compile</n-button>
        <n-button
          v-if="isCodeEditorActive"
          size="tiny"
          tertiary
          class="compile-btn"
          :disabled="compilingFlag"
          @click="triggerVisualize"
        >Visualize</n-button>
        <n-button v-if="canShowAdd" size="tiny" class="add-btn" @click="addNewTab(BlockId)">Add</n-button>
        <span :id="BlockId + '-suffix'" class="suffix-slot"></span>
        <transition name="fade">
          <div v-if="moreOpen" class="more-panel" @mousedown.stop @click.stop>
            <div class="panel-header">隐藏标签 ({{ hiddenTabs.length }})</div>
            <div class="more-item" v-for="(t,i) in hiddenTabs" :key="t.path + i">
              <span class="more-title" @click="selectFromMoreHidden(t)">{{ t.Tabs }}</span>
              <span class="more-actions">
                <a v-if="canClose(BlockId)" @click.prevent="closeHidden(t)">×</a>
              </span>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
  <div class="sampleBlock" :id="BlockId + '-block'">
    <keep-alive :include="['LessonPlayTab']">
      <component
        v-if="currentTab"
        :is="currentTab"
        :key="activePath"
        ref="activeComponentRef"
        v-bind="dynamicProps"
      ></component>
    </keep-alive>
    <div v-if="!currentTab" class="empty-block"></div>
  </div>
  <Teleport to="body">
    <div class="previewBlock" v-if="preview" :style="previewStyle"></div>
  </Teleport>
</template>

<script lang="js" setup>
import { LayOutStore } from "../../stores/LayOutStore";

import { reactive, ref, toRaw, toRef, onMounted, defineAsyncComponent, shallowRef, nextTick, onBeforeUnmount, computed, provide, watch } from "vue";
import { NFlex, NButton, useMessage } from "naive-ui";
import draggable from "vuedraggable";

const LayoutStore = LayOutStore();

const props = defineProps({
    BlockId:{
        type: String,
    },
})

const currentTab = shallowRef();
// 持有当前渲染组件实例引用（CodeEditor 暴露 compile/visualize）
const activeComponentRef = ref(null);
// 若点击时实例尚未 ready，记录待执行动作
const pendingAction = ref("");
// activePath: path@@leafId 用于样式判断
const activePath = ref("");
// 当前激活的 tab 对象（包含 code/output 等字段），通过 provide 暴露给子组件 (如 CodeEditor)
const activeTabRef = ref(null);
const message = useMessage();

// rename state
const renameIndex = ref(-1);
const renameText = ref("");
const renameInputRef = ref(null);

// overflow state
const showMore = ref(false);
const moreOpen = ref(false);
let resizeObserver = null;
// hidden overflow tabs (not rendered in scroll area)
const hiddenTabs = ref([]); // each element is tab object
const visibleTabs = computed(()=>{
  const all = GetTabs(props.BlockId);
  if(hiddenTabs.value.length === 0) return all;
  const hiddenSet = new Set(hiddenTabs.value);
  return all.filter(t=> !hiddenSet.has(t));
});
// 提供给 draggable 的 item-key 函数
function tabKeyFn(tab){ return tab.id || (tab.path + '_' + tab.Tabs); }
// show Add button only for coding leaf (contains at least one CodeEditor tab)
const canShowAdd = computed(()=> GetTabs(props.BlockId).some(t=> t.path === 'CodeEditor'));


onMounted(()=>{
  const defaultTab = GetTabs(props.BlockId)[0];
  activateTab(defaultTab, props.BlockId);
  monitorOverflow();
  document.addEventListener('click', handleGlobalClick);
  window.addEventListener('layout-activate-tab', onExternalActivate);
});

onBeforeUnmount(()=>{
  document.removeEventListener('click', handleGlobalClick);
  if(resizeObserver) resizeObserver.disconnect();
  window.removeEventListener('layout-activate-tab', onExternalActivate);
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

function activateTab(tab, leafId){
  if(!tab) return;
  activePath.value = tab.path + "@@" + leafId;
  currentTab.value = LayoutStore.ComponentMap[tab.path];
  activeTabRef.value = tab; // 更新注入引用
  if(tab.path === 'CodeEditor'){
    if(typeof tab.output === 'undefined') tab.output = '';
    if(typeof tab.code === 'undefined') tab.code = '';
    if(LayoutStore.activeCodeTabGlobal && 'value' in LayoutStore.activeCodeTabGlobal){
      LayoutStore.activeCodeTabGlobal.value = tab;
    }
  }
}

// 根据当前激活 tab 判断需要传递给组件的 props
const dynamicProps = computed(() => {
  const base = { currentId: props.BlockId };
  if (activeTabRef.value && activeTabRef.value.path === 'PreviewTab') {
    // PreviewTab 需要拿到 tab 对象解析 code 中的 JSON
    return { ...base, tab: activeTabRef.value };
  }
  return base;
});

// 处理来自外部（例如 CodeEditor 自动切换到 Output）的统一激活事件
function onExternalActivate(e){
  try {
    const { leafId, path, label } = e.detail || {};
    if(!leafId) return;
    if(leafId !== props.BlockId) return; // 只处理当前实例负责的 leaf
    const tabs = GetTabs(leafId);
    if(!tabs || !tabs.length) return;
    let target = null;
    if(path){ target = tabs.find(t=> t.path === path); }
    if(!target && label){ target = tabs.find(t=> t.Tabs === label); }
    if(!target) target = tabs[0];
    activateTab(target, leafId);
  } catch(err){ /* ignore */ }
}

function isActive(tab){
  return activePath.value === tab.path + "@@" + props.BlockId;
}
const isCodeEditorActive = computed(()=>{
  const t = activeTabRef.value;
  return t && t.path === 'CodeEditor';
});
const compilingFlag = computed(()=>{
  const inst = activeComponentRef.value;
  return !!(inst && inst.isCompiling);
});

// 触发当前 CodeEditor 的编译/调试：通过 DOM 查询当前块内第一个含 __vnode.ctx 暴露的组件实例
function resolveCodeEditorInstance(){
  if(!isCodeEditorActive.value) return null;
  const inst = activeComponentRef.value; // 真实组件实例（public proxy）
  return inst && typeof inst.compile === 'function' ? inst : null;
}
function triggerCompile(){
  const inst = resolveCodeEditorInstance();
  if(inst){ inst.compile(); return; }
  // 实例未就绪，排队到下一 tick
  pendingAction.value = 'compile';
  nextTick(()=>{
    const inst2 = resolveCodeEditorInstance();
    if(inst2){ inst2.compile(); pendingAction.value=''; }
  });
}
function triggerVisualize(){
  const inst = resolveCodeEditorInstance();
  if(inst){ inst.visualize(); return; }
  pendingAction.value = 'visualize';
  nextTick(()=>{
    const inst2 = resolveCodeEditorInstance();
    if(inst2){ inst2.visualize(); pendingAction.value=''; }
  });
}

// 当组件实例 ref 更新且有待执行动作时补发
watch(activeComponentRef, () => {
  if(!pendingAction.value) return;
  const inst = resolveCodeEditorInstance();
  if(!inst) return;
  if(pendingAction.value === 'compile') inst.compile();
  else if(pendingAction.value === 'visualize') inst.visualize();
  pendingAction.value = '';
});

function addNewTab(leafId){
  const created = LayoutStore.addTab(leafId, "CodeEditor");
  if(created){
    activateTab(created, leafId);
    monitorOverflowSoon();
  } else {
    message.error("无法添加标签");
  }
}

function canClose(leafId){
  // lessonplay 标签固定不可关闭
  const tabs = GetTabs(leafId);
  return tabs.length > 1 && !tabs.some(t=> t.path==='LessonPlayTab' && t.Tabs==='lessonplay');
}

function closeTab(idx, leafId, tab){
  const tabs = GetTabs(leafId);
  if(tabs.length <= 1){
    return message.warning("至少需要保留一个标签");
  }
  const removingActive = isActive(tab);
  const ok = LayoutStore.removeTab(leafId, idx);
  if(ok && removingActive){
    const newFirst = GetTabs(leafId)[0];
    activateTab(newFirst, leafId);
  }
  monitorOverflowSoon();
}
function closeVisible(idx, tab){
  // idx relative to visible list; map to absolute index
  const all = GetTabs(props.BlockId);
  const hiddenSet = new Set(hiddenTabs.value);
  let realIndex = -1; let count = -1;
  for(let i=0;i<all.length;i++){
    if(!hiddenSet.has(all[i])){ count++; if(count===idx){ realIndex = i; break; } }
  }
  if(realIndex>-1){
    closeTab(realIndex, props.BlockId, tab);
  }
}

function startRename(visibleIdx){
  // map visible index to real index
  const all = GetTabs(props.BlockId);
  const hiddenSet = new Set(hiddenTabs.value);
  let realIndex = -1; let count = -1;
  for(let i=0;i<all.length;i++){
    if(!hiddenSet.has(all[i])){ count++; if(count===visibleIdx){ realIndex = i; break; } }
  }
  if(realIndex===-1) return;
  renameIndex.value = realIndex;
  renameText.value = all[realIndex].Tabs;
  nextTick(()=>{ renameInputRef.value?.focus(); renameInputRef.value?.select(); });
}

function confirmRename(visibleIdx){
  // visibleIdx not used; rely on renameIndex real index stored
  const real = renameIndex.value;
  if(real < 0) return cancelRename();
  const val = renameText.value.trim();
  if(val){ LayoutStore.renameTab(props.BlockId, real, val); }
  cancelRename();
}

function cancelRename(){
  renameIndex.value = -1;
  renameText.value = "";
}

function monitorOverflow(){
  const header = document.getElementById(`${props.BlockId}-header`);
  if(!header) return;
  const bar = header.querySelector('.tabs-scroll');
  const actions = header.querySelector('.actions-cluster');
  if(!bar || !actions) return;

  const recompute = () => {
    const totalTabs = GetTabs(props.BlockId);
    const makeAllVisible = hiddenTabs.value.length>0;
    if(makeAllVisible){ hiddenTabs.value = []; return nextTick(recompute); }
    const headerWidth = header.clientWidth;
    const actionsWidth = actions.clientWidth;
    const available = headerWidth - actionsWidth - 16;
    const tabNodes = bar.querySelectorAll('.tab-wrapper');
    if(tabNodes.length !== totalTabs.length){ return nextTick(recompute); }
    let used = 0; let cutIndex = -1;
    for(let i=0;i<tabNodes.length;i++){
      const w = tabNodes[i].clientWidth + 4;
      if(used + w <= available){ used += w; } else { cutIndex = i; break; }
    }
    hiddenTabs.value = cutIndex === -1 ? [] : totalTabs.slice(cutIndex);
    // keep active visible
    if(hiddenTabs.value.length){
      const active = totalTabs.find(t=> isActive(t));
      if(active && hiddenTabs.value.includes(active)){
        const firstHiddenIndex = totalTabs.indexOf(hiddenTabs.value[0]);
        const activeIndex = totalTabs.indexOf(active);
        if(activeIndex >= firstHiddenIndex){
          const target = firstHiddenIndex - 1;
          if(target >=0){
            const tmp = totalTabs[target];
            totalTabs[target] = totalTabs[activeIndex];
            totalTabs[activeIndex] = tmp;
            return nextTick(recompute);
          }
        }
      }
    }
    showMore.value = hiddenTabs.value.length > 0;
    if(!showMore.value) moreOpen.value = false;
  };
  recompute();
  if(resizeObserver) resizeObserver.disconnect();
  resizeObserver = new ResizeObserver(()=> recompute());
  resizeObserver.observe(header);
}

function monitorOverflowSoon(){ nextTick(()=> monitorOverflow()); }

function toggleMore(){ moreOpen.value = !moreOpen.value; }
function handleGlobalClick(){ if(moreOpen.value) moreOpen.value = false; }

function selectFromMore(i, tab){ activateTab(tab, props.BlockId); moreOpen.value = false; }
function selectFromMoreHidden(tab){
  // move tab into visible area by swapping with last visible if needed
  activateTab(tab, props.BlockId);
  nextTick(()=> monitorOverflow());
  moreOpen.value = false;
}
function closeHidden(tab){
  const tabs = GetTabs(props.BlockId);
  const idx = tabs.indexOf(tab);
  if(idx>-1){
    closeTab(idx, props.BlockId, tab);
  }
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
      activateTab(defaultTab, props.BlockId);
    }

  }
};

const onMove = (e, originalEvent) => {
  if (e.relatedContext.element.disabledPark == true) return false;
  return true;
};

// 向后代组件注入当前激活的 tab 引用，使 CodeEditor 等可直接访问并实现每个标签独立 code
provide('activeTab', activeTabRef);
</script>

<style scoped lang="scss">
.sampleHeader {
  background-color: #efefef7b;
  width: 100%;
  height: 40px;
}
.tabs-bar { display:flex; align-items:center; width:100%; height:100%; overflow:visible; position:relative; }
.tabs-scroll { display:flex; align-items:center; gap:4px; overflow-x:auto; flex:1; padding:0 4px; }
.tabs-scroll::-webkit-scrollbar { height:6px; }
.tabs-scroll::-webkit-scrollbar-thumb { background:#ccc; border-radius:3px; }
.add-btn { flex:0 0 auto; }
.suffix-slot { flex:0 0 auto; margin-left:8px; display:inline-flex; align-items:center; }
.tabs-draggable { display:flex; gap:4px; }
.more-btn { margin-right:6px; }
.rename-input { width:90px; font-size:12px; padding:2px 4px; border:1px solid #ccc; border-radius:4px; }
.more-panel { position:absolute; top:36px; right:8px; background:#fff; border:1px solid #ccc; box-shadow:0 4px 12px rgba(0,0,0,.2); padding:6px 8px; z-index:4000; max-height:260px; overflow:auto; min-width:180px; border-radius:6px; }
.panel-header { font-size:12px; font-weight:600; padding:2px 0 6px; color:#666; }
.more-item { display:flex; justify-content:space-between; align-items:center; font-size:12px; padding:2px 0; }
.more-item .more-title { cursor:pointer; flex:1; }
.more-item .more-title:hover { color:#18a058; }
.more-item .more-actions a { color:#999; text-decoration:none; margin-left:6px; }
.more-item .more-actions a:hover { color:#e88080; }
.fade-enter-active,.fade-leave-active { transition:opacity .15s; }
.fade-enter-from,.fade-leave-to { opacity:0; }
.sampleBlock {
  background-color: #efefef;
  width: 100%;
  height: calc(100% - 40px);
}
.empty-block { width:100%; height:100%; }

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
.tab-wrapper { display:inline-flex; align-items:center; position:relative; }
.close-btn { margin-left:2px; padding:0 4px; }
.add-btn { height:100%; margin-left:4px; }
.suffix-slot { margin-left:6px; }
.actions-cluster { display:inline-flex; align-items:center; height:100%; position:relative; padding-right:4px; }
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
