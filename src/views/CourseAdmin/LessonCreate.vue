<template>
  <n-card title="创建课时" style="max-width: 700px; margin: 40px auto">
    <n-form :model="form" ref="formRef">
      <n-form-item label="课程ID" path="course_id">
        <n-input-number v-model:value="form.course_id" :min="1" />
      </n-form-item>
      <n-form-item label="课时标题" path="title">
        <n-input v-model:value="form.title" placeholder="请输入课时标题" />
      </n-form-item>
      <n-form-item label="排序" path="sort_order">
        <n-input-number v-model:value="form.sort_order" :min="1" />
      </n-form-item>
      <n-form-item label="视频录制">
        <div>
          <n-button @click="startCapture" :disabled="status !== 'idle'"
            >启用设备</n-button
          >
          <n-button @click="startRecording" :disabled="status !== 'ready'"
            >开始录制</n-button
          >
          <n-button @click="stopRecording" :disabled="status !== 'recording'"
            >停止录制</n-button
          >
          <n-button @click="downloadRecording" :disabled="!recordedBlob"
            >下载视频</n-button
          >
        </div>
        <video
          ref="previewVideo"
          autoplay
          playsinline
          muted
          style="
            width: 100%;
            max-height: 300px;
            background: #000;
            border-radius: 8px;
            margin-top: 10px;
          "
        ></video>
        <div
          v-if="status === 'recording'"
          style="color: #e74c3c; font-weight: bold; margin: 10px 0"
        >
          ● 录制中
        </div>
      </n-form-item>
      <n-form-item>
        <n-button type="primary" @click="uploadLesson" :disabled="!recordedBlob"
          >上传课时</n-button
        >
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script setup>
import { ref } from "vue";
import {
  useMessage,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NButton,
  NCard,
} from "naive-ui";
import { createLesson } from "../../api/courses";

const form = ref({
  course_id: 1,
  title: "",
  sort_order: 1,
});
const formRef = ref(null);
const message = useMessage();

const status = ref("idle");
const mediaStream = ref(null);
const mediaRecorder = ref(null);
const recordedChunks = ref([]);
const recordedBlob = ref(null);

function startCapture() {
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => {
      mediaStream.value = stream;
      document.querySelector("video").srcObject = stream;
      status.value = "ready";
    })
    .catch((e) => message.error("设备获取失败"));
}
function startRecording() {
  recordedChunks.value = [];
  try {
    mediaRecorder.value = new MediaRecorder(mediaStream.value, {
      mimeType: "video/webm",
    });
    mediaRecorder.value.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.value.push(e.data);
    };
    mediaRecorder.value.onstop = () => {
      recordedBlob.value = new Blob(recordedChunks.value, {
        type: "video/webm",
      });
    };
    mediaRecorder.value.start(100);
    status.value = "recording";
  } catch (e) {
    message.error("录制失败");
  }
}
function stopRecording() {
  if (mediaRecorder.value && status.value === "recording") {
    mediaRecorder.value.stop();
    status.value = "ready";
  }
}
function downloadRecording() {
  if (!recordedBlob.value) return;
  const url = URL.createObjectURL(recordedBlob.value);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lesson-${form.value.title || "video"}.webm`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
async function uploadLesson() {
  const fd = new FormData();
  fd.append("course_id", form.value.course_id);
  fd.append("title", form.value.title);
  fd.append("sort_order", form.value.sort_order);
  fd.append(
    "video_file",
    recordedBlob.value,
    `${form.value.course_id}_${form.value.title}.webm`
  );
  try {
    const res = await createLesson(fd);
    message.success("课时上传成功！");
  } catch (e) {
    message.error("上传失败");
  }
}
</script>
