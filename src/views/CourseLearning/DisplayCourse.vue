<template>
  <div>
    <h1>课程列表</h1>

    <div v-if="courseData">
      <div>
        <h2>课程目录</h2>
        <ul>
          <li
            v-for="(chapter, chapterIndex) in courseData.chapters"
            :key="chapterIndex"
          >
            <div @click="toggleChapter(chapterIndex)">{{ chapter.name }}</div>
            <ul v-show="isChapterOpen(chapterIndex)">
              <li
                v-for="(section, sectionIndex) in chapter.sections"
                :key="sectionIndex"
              >
                <button @click="selectSection(section)">
                  {{ section.name }}
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </div>

      <div>
        <div v-if="selectedSection">
          <h2>课程详情</h2>
          <div>
            <p>课程名称: {{ selectedSection.name }}</p>
            <p>视频资源路径: {{ selectedSection.videoPath }}</p>
            <p>代码文本文件路径:</p>
            <div
              v-for="(codeFile, index) in selectedSection.codeFiles"
              :key="index"
            >
              <p>{{ codeFile.codepath }}</p>
              <p>时间点: {{ formatTime(codeFile.timepoint) }}</p>
            </div>
          </div>
        </div>
        <div v-else>
          <p>请选择一个课程章节</p>
        </div>
      </div>
    </div>

    <div v-else>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";

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
  videoPath: string;
  codeFiles: CodeFile[];
}

interface CodeFile {
  timepoint: number;
  codepath: string;
  inputpath: string;
}

const courseData = ref<CourseData | null>(null);
const selectedSection = ref<Section | null>(null);
const openChapters = ref<number[]>([]);

const fetchCourseData = async () => {
  try {
    const response = await fetch("/course.json");
    if (!response.ok) {
      throw new Error("Failed to fetch course data");
    }
    courseData.value = await response.json();
  } catch (error) {
    console.error("Error fetching course data:", error);
  }
};

const selectSection = (section: Section) => {
  selectedSection.value = section;
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

const formatTime = (timepoint: number) => {
  const minutes = Math.floor(timepoint / 60);
  const seconds = Math.floor(timepoint % 60);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
};

onMounted(() => {
  fetchCourseData();
});
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
