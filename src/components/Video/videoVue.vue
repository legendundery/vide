<template>
  <div>
    <video
      ref="previewVideo"
      autoplay
      playsinline
      muted
      class="preview"
    ></video>
    <div v-if="status === 'recording'" class="recording-indicator">
      ● 录制中
    </div>

    <div class="controls">
      <button @click="startCapture" :disabled="status !== 'idle'">
        启用设备
      </button>
      <button @click="startRecording" :disabled="status !== 'ready'">
        开始录制
      </button>
      <button @click="stopRecording" :disabled="status !== 'recording'">
        停止录制
      </button>
      <button @click="downloadRecording" :disabled="!recordedBlob">
        下载视频
      </button>
      <br />
      <input v-model="lesson.course_id" />
      <input v-model="lesson.title" />
      <input v-model="lesson.sort_order" />
      <br />
      <button @click="uploadLesson">upload</button>
    </div>
  </div>
</template>

<script lang="js">
import { ref } from 'vue';

import { createLesson } from '../../api/courses';

// 合并流
const canvasEl = ref(document.createElement("canvas"));
const canvasContext = ref();
const isStopDraw = ref(false)

const getVideo = (stream, width = 800, height = 448) => {
  const videoEl = document.createElement('video');
  videoEl.autoplay = true;
  videoEl.srcObject = stream;
  videoEl.width = width;
  videoEl.height = height;
  videoEl.play();
  return videoEl;
};

const drawToCanvasScreenAndVideo = (screenEl, videoEl) => {
  if (isStopDraw.value) return;
   // 将屏幕共享绘制满canvas
  canvasContext.value.drawImage(screenEl, 0, 0, 800, 448);
  // 将摄像头绘制到canvas的右下角
  canvasContext.value.drawImage(videoEl, 600, 336, 200, 112);

  // 不断更新canvas的画面，这里也可以采用requestAnimationFrame来实现
  setTimeout(drawToCanvasScreenAndVideo.bind(undefined, screenEl, videoEl), 100);
}

export default {
  data() {
    return {
      status: "idle", // idle | ready | recording
      mediaStream: null,
      mediaRecorder: null,
      recordedChunks: [],
      recordedBlob: null,
      lesson :ref({
        course_id:2,
        title:"debug",
        sort_order:1,
      }),
    };
  },
  methods: {
    uploadLesson(){
      let formData = new FormData();
      formData.append("course_id", this.lesson.course_id);
      formData.append("title",this.lesson.title);
      formData.append("sort_order",this.lesson.sort_order);

      formData.append("video_file",this.recordedBlob, `${this.lesson.course_id}${this.lesson.title}.mp4`);
      console.log("start")
      createLesson(formData).then(result=>{
        console.log(result.data);
      })
    },

    async startCapture() {
      try {
        // 同时请求屏幕共享和摄像头/麦克风
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        /*
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        });
        */

         // 定义canvas的宽高
        canvasEl.value.width = 800;
        canvasEl.value.height = 448;

        canvasContext.value = canvasEl.value.getContext('2d');

        // 创建好video标签
        const screenEl = getVideo(displayStream);
        const videoEl = getVideo(userStream, 200, 112);

        drawToCanvasScreenAndVideo(screenEl, videoEl);

        const canvasStream = canvasEl.value.captureStream(60);

        /*
        this.mediaStream = new MediaStream([
          ...userStream.getVideoTracks(), // 包含摄像头画面
          ...displayStream.getVideoTracks(),
          ...userStream.getAudioTracks(),
        ]);
        */

        this.mediaStream = new MediaStream([
          ...canvasStream.getVideoTracks(), // 包含摄像头画面
          ...userStream.getAudioTracks(), // 包含摄像头画面
        ]);

        this.$refs.previewVideo.srcObject = this.mediaStream;
        this.status = "ready";

        // 处理轨道结束事件
        displayStream.getTracks().forEach((track) => {
          track.onended = () => this.stopCapture();
        });
      } catch (error) {
        console.error("获取媒体设备失败:", error);
        alert(`错误: ${error.message}`);
      }
    },

    startRecording() {
      this.recordedChunks = [];
      const options = { mimeType: "video/mp4" };

      try {
        this.mediaRecorder = new MediaRecorder(this.mediaStream, options);

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          this.recordedBlob = new Blob(this.recordedChunks, {
            type: "video/mp4",
          });

        };

        this.mediaRecorder.start(100); // 每100ms收集一次数据
        this.status = "recording";
      } catch (error) {
        console.error("录制失败:", error);
        alert(`录制错误: ${error.message}`);
      }
    },

    stopRecording() {
      if (this.mediaRecorder && this.status === "recording") {
        this.mediaRecorder.stop();
        this.status = "ready";
        isStopDraw.value = true;
      }
    },

    downloadRecording() {
      if (!this.recordedBlob) return;

      const url = URL.createObjectURL(this.recordedBlob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `录制-${new Date().toISOString().slice(0, 19)}.mp4`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    },

    stopCapture() {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
      }

      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }

      this.status = "idle";
      this.$refs.previewVideo.srcObject = null;
    },
  },
  beforeUnmount() {
    this.stopCapture();
  },
};
</script>

<style scoped>
.preview {
  width: 100%;
  max-height: 60vh;
  background: #000;
  border-radius: 8px;
}

.playback {
  width: 100%;
  margin-top: 20px;
  border-radius: 8px;
}

.controls {
  margin: 15px 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

button {
  padding: 10px 15px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}

.recording-indicator {
  color: #e74c3c;
  font-weight: bold;
  margin: 10px 0;
}
</style>
