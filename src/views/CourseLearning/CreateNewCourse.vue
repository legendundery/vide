<template>
  <div class="course-editor" style="height: 100%; overflow-y: auto">
    <h1>创建新课程</h1>

    <!-- 基本信息表单 -->
    <div class="form-section">
      <h2>课程基本信息</h2>
      <div class="form-group">
        <label>课程标题:</label>
        <input v-model="newCourse.title" placeholder="输入课程标题" />
      </div>

      <!-- 视频上传区域 -->
      <div class="form-group">
        <label>上传课程视频:</label>

        <input type="file" @change="handleVideoUpload" />
        <div v-if="videoUrl" class="video-preview">
          <video ref="videoRef" controls width="640" height="360">
            <source :src="videoUrl" type="video/mp4" />
            您的浏览器不支持视频播放
          </video>
        </div>
      </div>
    </div>

    <!-- 章节和小节管理 -->
    <div class="form-section">
      <h2>课程结构</h2>

      <!-- 添加章节 -->
      <div class="form-group">
        <label>章节名称:</label>
        <input v-model="newChapterName" placeholder="输入章节名称" />
        <button @click="addChapter">添加章节</button>
      </div>

      <!-- 章节列表 -->
      <div
        v-for="(chapter, chapterIndex) in newCourse.chapters"
        :key="chapterIndex"
        class="chapter-item"
      >
        <div class="chapter-header">
          <input v-model="chapter.name" placeholder="章节名称" />
          <button @click="deleteChapter(chapterIndex)">删除</button>
        </div>

        <!-- 添加小节 -->
        <div class="form-group">
          <label>小节名称:</label>
          <input
            v-model="newSectionNames[chapterIndex]"
            placeholder="输入小节名称"
          />
          <button @click="addSection(chapterIndex)">添加小节</button>
        </div>

        <!-- 小节列表 -->
        <div
          v-for="(section, sectionIndex) in chapter.sections"
          :key="sectionIndex"
          class="section-item"
        >
          <div class="section-header">
            <input v-model="section.name" placeholder="小节名称" />
            <button @click="deleteSection(chapterIndex, sectionIndex)">
              删除
            </button>
          </div>

          <!-- 视频时间点标记 -->
          <div class="form-group">
            <label>时间点标记:</label>
            <button @click="markTimepoint(chapterIndex, sectionIndex)">
              在当前时间添加标记
            </button>
            <span v-if="section.timepoint"
              >当前标记: {{ formatTime(section.timepoint) }}</span
            >
          </div>

          <!-- 代码文件上传 -->
          <div class="form-group">
            <label>代码文件:</label>
            <input
              type="file"
              @change="handleCodeUpload(chapterIndex, sectionIndex, $event)"
            />
            <span v-if="section.codeFiles.length"
              >已上传 {{ section.codeFiles.length }} 个文件</span
            >
          </div>

          <!-- 代码文件列表 -->
          <div v-if="section.codeFiles.length" class="code-files">
            <h4>代码文件列表:</h4>
            <div
              v-for="(file, fileIndex) in section.codeFiles"
              :key="fileIndex"
              class="code-file-item"
            >
              <span>{{ file.filename }}</span>
              <button
                @click="deleteCodeFile(chapterIndex, sectionIndex, fileIndex)"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 生成JSON -->
    <div class="form-section">
      <button @click="generateJSON">生成JSON</button>
      <div v-if="generatedJSON" class="json-preview">
        <h3>生成的JSON:</h3>
        <pre>{{ JSON.stringify(generatedJSON, null, 2) }}</pre>
        <button @click="downloadJSON">下载JSON</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";

// 扩展数据结构以支持创建
interface CourseData {
  title: string;
  chapters: Chapter[];
}

interface Chapter {
  name: string;
  sections: Section[];
}

interface Section {
  name: string;
  timepoint?: number; // 可选时间点
  videoPath?: string | null; // 修改为 string | null 与 videoUrl 类型一致
  codeFiles: CodeFile[];
}

interface CodeFile {
  filename: string;
  file: File;
  fileUrl: string;
  inputpath?: string; // 可选输入文件路径
}

// 状态定义
const newCourse = ref<CourseData>({
  title: "",
  chapters: [],
});

const newChapterName = ref("");
const newSectionNames = ref<string[]>([]);
const videoUrl = ref<string | null>(null);
const videoRef = ref<HTMLVideoElement | null>(null);
const generatedJSON = ref<any>(null);

// 处理视频上传
const handleVideoUpload = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;

  const file = files[0];
  const url = URL.createObjectURL(file);
  videoUrl.value = url;

  // 设置所有章节的视频路径
  newCourse.value.chapters.forEach((chapter) => {
    chapter.sections.forEach((section) => {
      section.videoPath = url;
    });
  });
};

// 添加章节
const addChapter = () => {
  if (!newChapterName.value.trim()) return;

  newCourse.value.chapters.push({
    name: newChapterName.value,
    sections: [],
  });

  newSectionNames.value.push("");
  newChapterName.value = "";
};

// 删除章节
const deleteChapter = (chapterIndex: number) => {
  newCourse.value.chapters.splice(chapterIndex, 1);
  newSectionNames.value.splice(chapterIndex, 1);
};

// 添加小节
const addSection = (chapterIndex: number) => {
  if (!newSectionNames.value[chapterIndex].trim()) return;

  newCourse.value.chapters[chapterIndex].sections.push({
    name: newSectionNames.value[chapterIndex],
    codeFiles: [],
    videoPath: videoUrl.value, // 直接赋值，类型已匹配
  });

  newSectionNames.value[chapterIndex] = "";
};

// 删除小节
const deleteSection = (chapterIndex: number, sectionIndex: number) => {
  newCourse.value.chapters[chapterIndex].sections.splice(sectionIndex, 1);
};

// 在当前视频时间点添加标记
const markTimepoint = (chapterIndex: number, sectionIndex: number) => {
  if (!videoRef.value) return;

  const timepoint = Math.floor(videoRef.value.currentTime);
  newCourse.value.chapters[chapterIndex].sections[sectionIndex].timepoint =
    timepoint;
};

// 处理代码文件上传
const handleCodeUpload = (
  chapterIndex: number,
  sectionIndex: number,
  e: Event
) => {
  const files = (e.target as HTMLInputElement).files;
  if (!files || files.length === 0) return;

  const file = files[0];
  const fileUrl = URL.createObjectURL(file);

  newCourse.value.chapters[chapterIndex].sections[sectionIndex].codeFiles.push({
    filename: file.name,
    file,
    fileUrl,
  });
};

// 删除代码文件
const deleteCodeFile = (
  chapterIndex: number,
  sectionIndex: number,
  fileIndex: number
) => {
  const file =
    newCourse.value.chapters[chapterIndex].sections[sectionIndex].codeFiles[
      fileIndex
    ];
  URL.revokeObjectURL(file.fileUrl); // 释放URL对象
  newCourse.value.chapters[chapterIndex].sections[
    sectionIndex
  ].codeFiles.splice(fileIndex, 1);
};

// 生成JSON
const generateJSON = () => {
  // 准备导出的JSON数据
  const exportData: CourseData = {
    title: newCourse.value.title,
    chapters: newCourse.value.chapters.map((chapter, chapterIndex) => ({
      name: chapter.name,
      sections: chapter.sections.map((section, sectionIndex) => ({
        name: section.name,
        videoPath: section.videoPath || "",
        codeFiles: section.codeFiles.map((file, fileIndex) => ({
          // 包含所有必要的属性
          ...file,
          timepoint: section.timepoint || 0,
          codepath: `/code/${file.filename}`,
          inputpath: `/input/${file.filename.replace(
            /\.[^/.]+$/,
            ""
          )}_input.txt`,
        })),
      })),
    })),
  };

  generatedJSON.value = exportData;
};

// 下载JSON文件
const downloadJSON = () => {
  if (!generatedJSON.value) return;

  const jsonStr = JSON.stringify(generatedJSON.value, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });

  // 创建下载链接
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${newCourse.value.title || "course"}.json`;

  // 触发下载
  document.body.appendChild(link);
  link.click();

  // 清理
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

// 时间格式化函数
const formatTime = (timepoint: number) => {
  const minutes = Math.floor(timepoint / 60);
  const seconds = Math.floor(timepoint % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};
</script>

<style scoped>
.course-editor {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  padding: 8px 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

button:hover {
  background-color: #45a049;
}

button.delete {
  background-color: #f44336;
}

button.delete:hover {
  background-color: #d32f2f;
}

.video-preview {
  margin-top: 15px;
}

.chapter-item,
.section-item {
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.chapter-header,
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.code-files {
  margin-top: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.code-file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.json-preview {
  margin-top: 15px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
