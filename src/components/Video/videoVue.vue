<template>
  <div class="recorder-wrapper">
    <!-- 实时预览（录制前 / 录制中显示） -->
    <div
      v-show="status !== 'idle' && !recordedBlob"
      class="live-preview-container"
    >
      <video
        ref="previewVideo"
        autoplay
        playsinline
        :muted="true"
        class="preview"
      ></video>
      <div v-if="status === 'recording'" class="recording-indicator">
        ● 录制中
      </div>
    </div>

    <!-- 录制完成后展示可控播放预览 -->
    <div v-if="recordedBlob" class="playback-container">
      <video
        ref="playbackVideo"
        class="playback"
        controls
        :src="playbackUrl"
      ></video>
      <div class="file-info">
        格式: {{ recordedBlob.type || "未知" }} | 大小:
        {{ prettySize(recordedBlob.size) }}
      </div>
    </div>

    <!-- 控件区域 -->
    <div class="controls">
      <!-- 初始 / 设备释放后 -->
      <button v-if="status === 'idle'" @click="startCapture">启用设备</button>

      <!-- 设备就绪 -->
      <template v-if="status === 'ready' && !recordedBlob">
        <button @click="startRecording">开始录制</button>
        <button @click="toggleMute" :disabled="!hasAudio()">
          {{ isMuted ? "取消静音" : "静音" }}
        </button>
      </template>

      <!-- 正在录制 -->
      <template v-if="status === 'recording'">
        <button @click="stopRecording">停止录制</button>
        <button @click="toggleMute" :disabled="!hasAudio()">
          {{ isMuted ? "取消静音" : "静音" }}
        </button>
      </template>

      <!-- 录制完成（回放阶段） -->
      <template v-if="recordedBlob && status !== 'recording'">
        <button @click="reRecord" :disabled="uploading || preUploaded">
          重新录制
        </button>
        <button v-if="!preUploaded" @click="emitUpload" :disabled="uploading">
          {{ uploading ? "上传中..." : "上传(随课时)" }}
        </button>
        <button
          v-if="!preUploaded"
          @click="uploadVideoAlone"
          :disabled="uploading"
        >
          {{ uploading ? "上传中..." : "预上传(视频)" }}
        </button>
        <button disabled v-if="preUploaded">已预上传</button>
        <button @click="downloadRecording" :disabled="uploading">
          下载 MP4
        </button>
        <button @click="toggleMutePlayback" :disabled="uploading">
          {{ playbackMuted ? "播放声音" : "静音预览" }}
        </button>
      </template>

      <!-- 永远可用的释放/结束（可选） -->
      <button v-if="status !== 'idle' && !recordedBlob" @click="stopCapture">
        释放设备
      </button>
    </div>
    <div class="upload-status" v-if="uploadMsg">{{ uploadMsg }}</div>

    <!-- 调试 / 可选表单（保留原始示例，隐藏化或后续移除） -->
    <details class="debug" v-if="showDebug">
      <summary>调试参数</summary>
      <input v-model="lesson.course_id" placeholder="course_id" />
      <input v-model="lesson.title" placeholder="title" />
      <input v-model="lesson.sort_order" placeholder="sort_order" />
      <button @click="uploadLesson" :disabled="!recordedBlob">
        (示例)直接创建Lesson
      </button>
    </details>
  </div>
</template>

<script lang="js">
import { ref } from 'vue';

import { createLesson, uploadVideoOnly } from '../../api/courses';

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
  try {
    canvasContext.value.drawImage(screenEl, 0, 0, 800, 448);
    canvasContext.value.drawImage(videoEl, 600, 336, 200, 112);
  } catch(e){ /* ignore drawing errors */ }
  // requestAnimationFrame(()=> drawToCanvasScreenAndVideo(screenEl, videoEl));
};

export default {
  emits: ['upload','video-pre-uploaded','recording-start','recording-stop'],
  data() {
    return {
      status: 'idle', // idle | ready | recording
      mediaStream: null,
      mediaRecorder: null,
      recordedChunks: [],
      recordedBlob: null,
      playbackUrl: '',
      selectedMime: '',
      isMuted: false,
      playbackMuted: false,
	  drawInterval: null,
  screenElRef: null,
  cameraElRef: null,
      lesson: ref({
        course_id: 2,
        title: 'debug',
        sort_order: 1,
        lesson_id: 1,
      }),
      showDebug: false,
  uploading:false,
  uploadMsg:'',
  preUploaded:false,
  preVideoMeta:null,
    };
  },
  methods: {
    prettySize(bytes){
      if(!bytes && bytes!==0) return '';
      const units=['B','KB','MB','GB'];
      let v=bytes, i=0; while(v>=1024 && i<units.length-1){ v/=1024; i++; }
      return v.toFixed( (i===0)?0:1 ) + units[i];
    },
    hasAudio(){
      return !!(this.mediaStream && this.mediaStream.getAudioTracks().length);
    },
    toggleMute(){
      if(!this.mediaStream) return;
      const tracks = this.mediaStream.getAudioTracks();
      if(!tracks.length) return;
      this.isMuted = !this.isMuted;
      tracks.forEach(t=> t.enabled = !this.isMuted);
    },
    toggleMutePlayback(){
      const el = this.$refs.playbackVideo;
      if(el){ this.playbackMuted = !this.playbackMuted; el.muted = this.playbackMuted; }
    },
    pickSupportedMime(){
      const preferred = [
        'video/mp4;codecs=h264,aac',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      for(const m of preferred){
        if(window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
      }
      return '';
    },
    uploadLesson(){
      let formData = new FormData();
      formData.append("course_id", this.lesson.course_id);//该课程所属于的courses的id,lessonsid是由数据库自动生成的
      formData.append("title",this.lesson.title);
      formData.append("sort_order",this.lesson.sort_order);
      if(this.recordedBlob){
        const ext = this.recordedBlob.type.includes('mp4')? 'mp4':'webm';
        formData.append("video_file",this.recordedBlob, `${this.lesson.course_id}${this.lesson.title}.${ext}`);
      }
      console.log("start")
      createLesson(formData).then(result=>{
        console.log(result.data);
      })
    },
    async emitUpload(){
      if(!this.recordedBlob || this.uploading){ return; }
      this.uploading = true;
      try {
        const ext = this.recordedBlob.type.includes('mp4')? 'mp4':'webm';
        const file = new File([this.recordedBlob], `recorded-${Date.now()}.${ext}`, { type: this.recordedBlob.type });
        // 如果父组件监听 upload，可在其内部真正发请求，这里先发出事件
        this.$emit('upload', file);
        // 同时提供一个可选内置直传：若需要可在外部关闭此逻辑
        if(!this.$attrs['no-inline-upload']){
          // 占位：可在此直接调用 createLesson 或独立上传接口
          // await someApi(file)
        }
        this.uploadMsg = '上传事件已发送';
        this.$nextTick(()=>{ this.$emit('upload-success'); });
      } catch(e){
        console.error(e);
        this.$emit('upload-error', e);
        this.uploadMsg = '上传失败';
      } finally {
        this.uploading = false;
      }
    },
    async uploadVideoAlone(){
      if(!this.recordedBlob || this.uploading || this.preUploaded) return;
      this.uploading = true; this.uploadMsg='';
      try {
        const file = this.getRecordedFile();
        if(!file) throw new Error('未获取到录制文件');
        const resp = await uploadVideoOnly(file);
        this.preUploaded = true;
        this.preVideoMeta = resp.data;
        this.uploadMsg = '预上传成功';
        this.$emit('video-pre-uploaded', resp.data);
      } catch(e){
        console.error(e);
        this.uploadMsg = '预上传失败';
      } finally { this.uploading=false; }
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
  this.screenElRef = getVideo(displayStream);
  this.cameraElRef = getVideo(userStream, 200, 112);

  drawToCanvasScreenAndVideo(this.screenElRef, this.cameraElRef);

        const canvasStream = canvasEl.value.captureStream(60);

        /*
        this.mediaStream = new MediaStream([
          ...userStream.getVideoTracks(), // 包含摄像头画面
          ...displayStream.getVideoTracks(),
          ...userStream.getAudioTracks(),
        ]);
        */

        this.mediaStream = new MediaStream([
          ...canvasStream.getVideoTracks(),
          ...userStream.getAudioTracks(),
        ]);

  // 先切换状态确保 previewVideo 已渲染 (v-show 不会卸载)
  this.status = 'ready';
  const pv = this.$refs.previewVideo;
  if(pv){ pv.srcObject = this.mediaStream; }

        // 处理轨道结束事件
        displayStream.getTracks().forEach((track) => {
          track.onended = () => this.stopCapture();
        });
      } catch (error) {
        console.error("获取媒体设备失败:", error);
        alert(`错误: ${error.message}`);
      }
    },

    async startRecording() {
      if (!this.mediaStream) return;
      this.status = 'recording';
      this.$emit('recording-start');
      this.recordedChunks = [];
      this.recordedBlob = null;
      this.playbackUrl = '';
      this.selectedMime = this.pickSupportedMime();

      canvasEl.value.width = 800;
      canvasEl.value.height = 448;
      isStopDraw.value = false;
      this.drawInterval = setInterval(() => {
        drawToCanvasScreenAndVideo(this.screenElRef, this.cameraElRef);
      }, 1000 / 30); // 30fps

      const combinedStream = canvasEl.value.captureStream(30);
      const audioStream = this.mediaStream.getAudioTracks();
      if (audioStream.length > 0) {
        combinedStream.addTrack(audioStream[0]);
      }

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: this.selectedMime,
      });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        this.recordedBlob = new Blob(this.recordedChunks, {
          type: this.selectedMime || this.recordedChunks[0]?.type || "video/webm",
        });
        this.playbackUrl = URL.createObjectURL(this.recordedBlob);
        this.status = 'ready';
        this.$emit('recording-stop');
      };
      this.mediaRecorder.start();
    },

    stopRecording() {
      if (this.mediaRecorder && this.status === 'recording') {
        this.mediaRecorder.stop();
        isStopDraw.value = true;
        if (this.drawInterval) {
          clearInterval(this.drawInterval);
          this.drawInterval = null;
        }
      }
    },

    downloadRecording() {
      if (!this.recordedBlob) return;
      const ext = this.recordedBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const url = URL.createObjectURL(this.recordedBlob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `录制-${new Date().toISOString().replace(/[:T]/g,'-').slice(0,19)}.${ext}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    },
    reRecord(){
      // 保留设备，不重新申请；清空已有结果
      if(this.status==='recording') return;
      this.recordedBlob = null;
      this.playbackUrl = '';
      this.recordedChunks = [];
      this.status = this.mediaStream? 'ready':'idle';
      if(this.mediaStream && this.screenElRef && this.cameraElRef){
        isStopDraw.value = false;
        const pv = this.$refs.previewVideo;
        if(pv){ pv.srcObject = this.mediaStream; pv.play && pv.play(); }
        drawToCanvasScreenAndVideo(this.screenElRef, this.cameraElRef);
      }
    },

    stopCapture() {
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach((track) => track.stop());
        this.mediaStream = null;
      }

      if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }

      if (this.drawInterval) {
        clearInterval(this.drawInterval);
        this.drawInterval = null;
      }

      this.status = "idle";
      this.$refs.previewVideo.srcObject = null;
      isStopDraw.value = true;
      this.screenElRef = null;
      this.cameraElRef = null;
    },
    getRecordedFile(){
      if(!this.recordedBlob) return null;
      const ext = this.recordedBlob.type.includes('mp4')? 'mp4':'webm';
      return new File([this.recordedBlob], `recorded-${Date.now()}.${ext}`, { type: this.recordedBlob.type });
    },
  },
  beforeUnmount() {
    this.stopCapture();
  },
};
</script>

<style scoped>
.recorder-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.live-preview-container,
.playback-container {
  position: relative;
}
.preview,
.playback {
  width: 100%;
  background: #000;
  border-radius: 8px;
  max-height: 60vh;
}
.recording-indicator {
  position: absolute;
  top: 8px;
  left: 12px;
  background: rgba(0, 0, 0, 0.55);
  color: #ff5f56;
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 12px;
  letter-spacing: 1px;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
button {
  padding: 8px 14px;
  background: #3498db;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
button:disabled {
  background: #95a5a6;
  cursor: not-allowed;
}
.file-info {
  margin-top: 6px;
  font-size: 12px;
  color: #666;
}
.debug {
  font-size: 12px;
}
</style>
