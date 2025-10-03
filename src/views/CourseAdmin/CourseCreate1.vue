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
        <n-input-number v-model:value="form.instructor_id" :min="1" clearable />
        <!-- 添加 clearable 允许清空，但验证会确保有效值 -->
      </n-form-item>
      <n-form-item label="分类" path="category">
        <n-input v-model:value="form.category" placeholder="分类" />
      </n-form-item>
      <n-form-item label="价格" path="price">
        <n-input-number v-model:value="form.price" :min="0" clearable />
      </n-form-item>
      <n-form-item label="封面图" path="cover_url">
        <!-- 假设 uploadUrl 是一个专门的图片上传接口 -->
        <n-upload
          :action="uploadUrl"
          :max="1"
          @finish="handleCoverFinish"
          list-type="image-card"
          accept="image/*"
        >
          <n-button>上传图片</n-button>
        </n-upload>
        <span v-if="form.cover_url" style="margin-left: 10px; color: green"
          >已上传封面</span
        >
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
// 导入你的 API 函数，可能还需要导入 uploadImage
import { createCourse } from "../../api/courses"; // 假设这是你的 API 封装文件

const form = ref({
  title: "",
  description: "",
  instructor_id: null, // 初始设为 null，因为 n-input-number 可能会返回 null
  category: "",
  price: null, // 初始设为 null
  cover_url: "", // 封面图 URL，由上传组件处理
});

const rules = {
  title: { required: true, message: "请输入课程标题", trigger: "blur" },
  description: { required: true, message: "请输入课程描述", trigger: "blur" },
  instructor_id: {
    required: true,
    type: "number",
    message: "请输入讲师ID",
    trigger: ["input", "blur"], // input 和 blur 都触发验证
    validator: (rule, value) => {
      if (value === null) {
        return new Error("讲师ID不能为空");
      }
      if (!Number.isInteger(value) || value <= 0) {
        return new Error("讲师ID必须是正整数");
      }
      return true;
    },
  },
  category: { required: true, message: "请输入课程分类", trigger: "blur" },
  price: {
    required: true,
    type: "number",
    message: "请输入价格",
    trigger: ["input", "blur"],
    validator: (rule, value) => {
      if (value === null) {
        return new Error("价格不能为空");
      }
      if (value < 0) {
        return new Error("价格不能为负数");
      }
      return true;
    },
  },
  cover_url: {
    // 如果封面图是必填项，请将 required 设置为 true
    required: false,
    message: "请上传课程封面图",
    trigger: "change", // 或者在上传完成时手动触发验证
  },
};

const formRef = ref(null); // 用于引用 n-form 组件，以便调用 validate 方法
const message = useMessage(); // Naive UI 的消息提示
// 假设这是专门的图片上传接口
const uploadUrl = "/api/upload/course-cover"; // 请根据你的后端实际接口调整

// 处理封面图上传完成事件
function handleCoverFinish({ file, event }) {
  // naive-ui自动上传，后端返回cover_url
  // event.target.response 是原始的 XMLHttpRequest 响应文本
  try {
    const res = JSON.parse(event.target.response);
    // 假设后端成功上传后返回 { cover_url: "your_image_url_here" }
    if (res && res.cover_url) {
      form.value.cover_url = res.cover_url;
      message.success("封面上传成功！");
      // 如果 cover_url 是必填，可以在这里手动触发其验证
      // formRef.value?.validateField('cover_url');
    } else {
      message.error("封面上传失败：未从服务器获取到图片URL。");
    }
  } catch (e) {
    console.error("解析封面上传响应失败:", e);
    message.error("封面上传失败：服务器响应格式错误。");
  }
}

// 处理表单提交
async function handleSubmit() {
  try {
    // 1. 调用 Naive UI 的表单验证
    // 如果验证失败，会抛出错误，进入 catch 块
    await formRef.value?.validate();

    // 2. 构建 FormData 对象，用于发送 multipart/form-data 请求
    const params = new FormData();
    Object.keys(form.value).forEach((key) => {
      const value = form.value[key];
      // 只将有值（非 null, 非 undefined, 非空字符串）的字段添加到 FormData
      // 空字符串字段根据后端需求，如果需要发送空字符串，则删除 value !== '' 判断
      if (value !== null && value !== undefined && value !== "") {
        params.append(key, value);
      } else if (key === "cover_url" && value === "") {
        // 特别处理 cover_url，如果为空，也可能需要发送空字符串而不是忽略
        // 这取决于后端如何处理缺少的封面 URL
        params.append(key, "");
      }
      // 对于 number 类型的字段，如果表单规则已确保有值，这里不需要额外处理 null
    });

    // 3. 调用 API 发送请求
    const res = await createCourse(params); // createCourse 应该返回成功数据
    message.success("课程创建成功！");

    // 可以在这里清空表单或者进行页面跳转
    // formRef.value?.restoreValidation(); // 清除表单验证状态
    // Object.assign(form.value, { // 重置表单数据
    //   title: "", description: "", instructor_id: null,
    //   category: "", price: null, cover_url: ""
    // });
  } catch (e) {
    console.error("创建课程失败:", e); // 在控制台打印详细错误，方便调试
    let errorMessage = "创建失败，请稍后再试。";

    // 根据后端返回的错误结构提取信息
    // 假设后端错误响应是 { message: "...", statusCode?: ... }
    if (e.message) {
      errorMessage = e.message;
    }
    // 如果是 Naive UI 表单验证未通过，e 可能是一个错误数组
    else if (Array.isArray(e) && e.length > 0 && e[0].message) {
      errorMessage = "表单填写有误：" + e[0].message;
    }

    message.error(errorMessage); // 在页面上显示具体的错误信息
  }
}
</script>

<style scoped>
/* 可以添加一些自定义样式 */
</style>
