<template>
  <n-card title="创建课程" style="max-width: 600px; margin: 40px auto">
    <n-form :model="form" :rules="rules" ref="formRef">
      <n-form-item label="课程标题" path="title">
        <n-input v-model:value="form.title" placeholder="请输入课程标题" />
      </n-form-item>
      <n-form-item label="课程描述" path="description">
        <n-input
          v-model:value="form.description"
          type="textarea"
          placeholder="请输入课程描述"
        />
      </n-form-item>
      <n-form-item v-if="showInstructorSelect" label="讲师" path="instructor_id">
        <n-select
          v-model:value="form.instructor_id"
          :options="instructorOptions"
          filterable
          placeholder="选择讲师"
        />
      </n-form-item>
      <n-form-item label="分类" path="category">
        <n-input v-model:value="form.category" placeholder="分类" />
      </n-form-item>
      <n-form-item label="价格" path="price">
        <n-input-number v-model:value="form.price" :min="0" />
      </n-form-item>
      <n-form-item label="封面图" path="cover_file">
        <div class="cover-upload-wrapper">
          <n-upload :default-upload="false" :max="1" @change="handleCoverChange">
            <n-button>选择文件</n-button>
          </n-upload>
          <div v-if="coverPreview" class="cover-preview">
            <img :src="coverPreview" alt="cover" />
            <n-button quaternary size="tiny" @click="removeCover">移除</n-button>
          </div>
        </div>
      </n-form-item>
      <n-form-item label="Metadata(JSON)" path="metadata">
        <n-input
          v-model:value="form.metadata"
          type="textarea"
          :autosize="{minRows:3,maxRows:6}"
          placeholder='{"level":"初级","tags":["C++","基础"]}'
        />
      </n-form-item>
      <n-form-item>
        <n-button type="primary" @click="handleSubmit">提交</n-button>
      </n-form-item>
    </n-form>
  </n-card>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import {
  useMessage,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NButton,
  NCard,
  NUpload,
} from "naive-ui";
import { createCourse } from "../../api/courses";
import newAxios from "../../request";
import { UserStore } from "../../stores/UserStore";

// 用于存储文件对象
const coverFile = ref(null);
const coverPreview = ref("");

const userStore = UserStore();
const form = ref({
  title: "",
  description: "",
  instructor_id: null,
  category: "",
  price: 0,
  metadata: "",
});
const instructorOptions = ref([]);
const showInstructorSelect = computed(() => userStore.role === 'admin');

const rules = {
  title: { required: true, message: "请输入课程标题", trigger: "blur" },
  instructor_id: {
    required: true,
    type: "number",
    message: "请输入讲师ID",
    trigger: "blur",
  },
  // cover_file: {
  //   required: true,
  //   validator: () => coverFile.value !== null,
  //   message: "请上传封面图",
  //   trigger: ["change"],
  // },
};

const formRef = ref(null);
const message = useMessage();

// 文件选择变化时的回调
function handleCoverChange(options) {
  if (options.fileList.length > 0) {
    coverFile.value = options.file.file;
    coverPreview.value = URL.createObjectURL(options.file.file);
  } else {
    coverFile.value = null;
    coverPreview.value = "";
  }
}

function removeCover(){
  coverFile.value = null;
  coverPreview.value = "";
}

async function handleSubmit() {
  await formRef.value?.validate();

  // 创建 FormData 对象
  const fd = new FormData();

  // 依次追加表单的文本数据
  fd.append("title", form.value.title);
  fd.append("description", form.value.description);
  fd.append("instructor_id", form.value.instructor_id);
  fd.append("category", form.value.category);
  fd.append("price", form.value.price);
  if (form.value.metadata) {
    fd.append("metadata", form.value.metadata);
  }
  // 非管理员（teacher）强制使用自己的 id
  if (!showInstructorSelect.value) {
    fd.set("instructor_id", String(userStore.user_id));
  } else if (form.value.instructor_id) {
    fd.append("instructor_id", String(form.value.instructor_id));
  }

  // 追加文件数据
  if (coverFile.value) {
    fd.append("cover_file", coverFile.value, coverFile.value.name);
  }

  try {
    const res = await createCourse(fd);
    message.success("课程创建成功！");
  } catch (e) {
    message.error("创建失败");
  }
}

onMounted(async () => {
  if (showInstructorSelect.value) {
    // 从后端获取讲师列表（假设 role=teacher）
    try {
      const res = await newAxios.get("api/users");
      instructorOptions.value = (res.data.users || [])
        .filter((u) => u.role === 'teacher')
        .map((u) => ({ label: `#${u.user_id} - ${u.username}`, value: u.user_id }));
    } catch (e) {
      // 忽略错误仅不显示
    }
  }
  if (userStore.role === 'teacher') {
    form.value.instructor_id = userStore.user_id;
  }
});
</script>

<style scoped>
.cover-upload-wrapper { display:flex; gap:12px; align-items:flex-start; }
.cover-preview { display:flex; flex-direction:column; gap:4px; }
.cover-preview img { width:120px; height:80px; object-fit:cover; border:1px solid #ddd; border-radius:4px; }
</style>
