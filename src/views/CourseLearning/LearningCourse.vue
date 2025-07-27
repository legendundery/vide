<template>
  <div class="box">
    <div class="left-content" title="左">
      <h1>{{ courseTitle }}</h1>
      <h2>{{ selectedSection?.name || "请选择章节" }}</h2>
      <div class="chapters-container">
        <h2>课程章节</h2>
        <ul>
          <li
            v-for="(chapter, chapterIndex) in courseData?.chapters || []"
            :key="chapterIndex"
          >
            <div @click="toggleChapter(chapterIndex)">{{ chapter.name }}</div>
            <ul v-show="isChapterOpen(chapterIndex)">
              <li
                v-for="(section, sectionIndex) in chapter.sections"
                :key="sectionIndex"
              >
                <button @click="selectSection(section, chapter.name)">
                  {{ section.name }}
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </div>
      <div class="player-container" v-if="selectedSection">
        <div class="video-container" style="width: 100%; height: 500px">
          <video
            ref="videoRef"
            controls
            @timeupdate="updateCurrentCodeFile"
            style="width: 100%; height: auto"
          >
            <source :src="selectedSection?.videoPath" type="video/mp4" />
            您的浏览器不支持视频播放
          </video>
        </div>
      </div>
    </div>

    <div class="right-content" title="右">
      <div>
        <div v-if="!currentCodeFile">等待视频播放...</div>
        <div v-else>
          <a-button></a-button>
        </div>
        <div class="coding_space">
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
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.box {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
}

.left-content {
  flex: 1;
}

.right-content {
  flex: 1;
}
</style>

<script lang="ts" setup>
import { ref, onMounted, watch } from "vue";

interface CourseData {
  title: string;
  chapters: Chapter[];
}

interface Chapter {
  ID: number;
  name: string;
  sections: Section[];
}

interface Section {
  ID: number;
  name: string;
  videoPath: string;
  codeFiles: CodeFile[];
}

interface CodeFile {
  ID: number;
  timepoint: number;
  codepath: string;
  inputpath: string;
  isloading: boolean;
}

const videoRef = ref<HTMLVideoElement | null>(null);
const courseData = ref<CourseData | null>(null);
const selectedSection = ref<Section | null>(null);
const courseTitle = ref("");
const chapterName = ref("");
const openChapters = ref<number[]>([]);
const currentCodeFile = ref<CodeFile | null>(null);
const codeContent = ref("");
const inputContent = ref("");
const loadingCode = ref(false);

const fetchCourseData = async () => {
  try {
    const response = await fetch("/course.json");
    if (!response.ok) {
      throw new Error("Failed to fetch course data");
    }
    courseData.value = await response.json();
    courseTitle.value = courseData.value?.title || "C++学习";
  } catch (error) {
    console.error("Error fetching course data:", error);
  }
};

const selectSection = (section: Section, chapter: string) => {
  selectedSection.value = section;
  chapterName.value = chapter;
  currentCodeFile.value = null;
  codeContent.value = "";
  inputContent.value = "";

  if (videoRef.value) {
    videoRef.value.currentTime = 0;
    videoRef.value.src = section.videoPath;
    videoRef.value.load();
  }
};

const toggleChapter = (index: number) => {
  const chapterIndex = openChapters.value.indexOf(index);
  if (chapterIndex > -1) {
    openChapters.value.splice(chapterIndex, 1);
  } else {
    openChapters.value.push(index);
  }
};

const isChapterOpen = (index: number) => {
  return openChapters.value.includes(index);
};

const fetchFileContent = async (path: string) => {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${path}`);
    }
    return await response.text();
  } catch (error) {
    console.error("Error fetching file content:", error);
    return "文件加载失败";
  }
};

const updateCurrentCodeFile = async () => {
  if (!videoRef.value || !selectedSection.value) return;

  const currentTime = videoRef.value.currentTime;
  const codeFiles = selectedSection.value.codeFiles;

  // 找到当前时间点对应的代码文件
  let currentIndex = -1;
  for (let i = 0; i < codeFiles.length; i++) {
    if (currentTime >= codeFiles[i].timepoint) {
      currentIndex = i;
    } else {
      break;
    }
  }

  if (
    currentIndex !== -1 &&
    codeFiles[currentIndex] !== currentCodeFile.value
  ) {
    currentCodeFile.value = codeFiles[currentIndex];
    loadingCode.value = true;

    // 并行加载代码和输入文件
    const [code, input] = await Promise.all([
      fetchFileContent(currentCodeFile.value.codepath),
      fetchFileContent(currentCodeFile.value.inputpath),
    ]);

    codeContent.value = code;
    inputContent.value = input;
    loadingCode.value = false;
    panes.value[0].codingcontent = `${codeContent.value}`;
    panes.value[0].inputcontent = `${inputContent.value}`;
    if (currentCodeFile.value.isloading !== true) {
      autoadd();
      currentCodeFile.value.isloading = true;
    }
  }
};

const autoadd = () => {
  activeKey.value = ++newTabIndex.value;
  panes.value.push({
    title: `videocode${activeKey.value}`,
    key: activeKey.value,
    codingcontent: `${codeContent.value}`,
    inputcontent: `${inputContent.value}`,
    outputcontent: "",
    fileID: ``,
  });
};

onMounted(() => {
  fetchCourseData();
});

watch(selectedSection, (newSection) => {
  if (newSection && videoRef.value) {
    videoRef.value.play().catch((err) => {
      console.error("Error playing video:", err);
    });
  }
});

//代码空间部分

import codeSpace from "@/components/codeSpace.vue";
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
      currentoutput.value = result.data.output;
      panes.value[currentid.value].outputcontent = currentoutput.value;
      console.log(currentoutput.value);
    })
    .catch((err) => {
      console.log(err);
    });
};
/*
// 搜索函数
function useFileSearch(courseData: CourseData) {
  // 当前搜索的FILEID
  const searchFileId = ref<string>("");

  // 搜索结果
  const searchResult = computed(() => {
    if (!searchFileId.value) return null;

    // 解析FILEID为数组
    const ids = searchFileId.value.split("-").map(Number);
    if (ids.length !== 3) return null;

    const [chapterId, sectionId, fileId] = ids;

    // 查找对应的章节
    const chapter = courseData.chapters.find((ch) => ch.ID === chapterId);
    if (!chapter) return null;

    // 查找对应的小节
    const section = chapter.sections.find((sec) => sec.ID === sectionId);
    if (!section) return null;

    // 查找对应的代码文件
    const codeFile = section.codeFiles.find((file) => file.ID === fileId);
    if (!codeFile) return null;

    // 返回完整信息
    return {
      chapter,
      section,
      codeFile,
      fullPath: `${chapter.name}/${section.name}/${codeFile.ID}`,
    };
  });

  // 执行搜索的函数
  const searchFile = (fileId: string) => {
    searchFileId.value = fileId;
  };

  return {
    searchFileId,
    searchResult,
    searchFile,
  };
}
*/
//选项卡

const panes = ref<
  {
    title: string;
    key: number;
    codingcontent: any;
    inputcontent: any;
    outputcontent: any;
    closable?: boolean;
    fileID: string;
  }[]
>(
  new Array(1).fill(null).map((_, index) => {
    const id = index;
    const codingcontent = ref(`write code here.`);
    const inputcontent = ref("");
    const outputcontent = ref("");
    return {
      title: `code ${id}`,
      key: id,
      codingcontent: codingcontent,
      inputcontent: inputcontent,
      outputcontent: outputcontent,
      fileID: "-1",
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
    fileID: "-1",
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

<style scoped>
/* 整体布局 */
.course-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #2c3e50;
  font-size: 24px;
  margin-bottom: 20px;
}

h2 {
  color: #34495e;
  font-size: 18px;
  margin-top: 30px;
  margin-bottom: 15px;
}

/* 课程目录样式 */
ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 10px;
}

li > div {
  cursor: pointer;
  font-weight: 500;
  color: #3498db;
  padding: 8px 0;
  transition: color 0.2s;
}

li > div:hover {
  color: #2980b9;
}

li > ul {
  padding-left: 20px;
  border-left: 1px solid #eee;
  margin-left: 5px;
  margin-top: 5px;
}

/* 章节按钮样式 */
button {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 12px;
  margin-right: 10px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #e8e8e8;
}

/* 课程详情样式 */
.course-details {
  background-color: #f9f9f9;
  border-radius: 5px;
  padding: 15px;
  margin-top: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.course-details p {
  margin: 8px 0;
}

/* 代码文件列表样式 */
.code-files {
  margin-top: 15px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.code-files p {
  margin: 5px 0;
}

/* 加载状态样式 */
.loading {
  color: #95a5a6;
  font-style: italic;
  text-align: center;
  padding: 30px;
}

/* 未选择章节提示 */
.no-selection {
  color: #7f8c8d;
  font-style: italic;
  padding: 20px;
  text-align: center;
}
</style>
