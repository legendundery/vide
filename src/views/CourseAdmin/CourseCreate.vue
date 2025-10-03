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
      <n-form-item label="讲师ID" path="instructor_id">
        <n-input-number v-model:value="form.instructor_id" :min="1" />
      </n-form-item>
      <n-form-item label="分类" path="category">
        <n-input v-model:value="form.category" placeholder="分类" />
      </n-form-item>
      <n-form-item label="价格" path="price">
        <n-input-number v-model:value="form.price" :min="0" />
      </n-form-item>
      <n-form-item label="封面图" path="cover_file">
        <n-upload :default-upload="false" :max="1" @change="handleCoverChange">
          <n-button>选择文件</n-button>
        </n-upload>
      </n-form-item>
      <n-form-item>
        <n-button type="primary" @click="handleSubmit">提交</n-button>
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
  NUpload,
} from "naive-ui";
import { createCourse } from "../../api/courses";

// 用于存储文件对象
const coverFile = ref(null);

const form = ref({
  title: "",
  description: "",
  instructor_id: 1,
  category: "",
  price: 0,
});

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
    coverFile.value = options.file.file; // 获取原始File对象
  } else {
    coverFile.value = null;
  }
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
</script>
