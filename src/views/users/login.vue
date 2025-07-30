<template>
  <n-form
    ref="formRef"
    inline
    :label-width="80"
    :model="formValue"
    :rules="rules"
    :size="size"
  >
    <n-form-item label="username" path="user.name">
      <n-input v-model:value="formValue.user.name" placeholder="username" />
    </n-form-item>
    <n-form-item label="password" path="user.password">
      <n-input v-model:value="formValue.user.password" placeholder="password" />
    </n-form-item>

    <n-form-item>
      <n-button attr-type="button" @click="handleValidateClick">
        验证
      </n-button>
    </n-form-item>
  </n-form>
</template>

<script lang="ts" setup>
import type { FormInst } from "naive-ui";
import { NForm, NFormItem, NButton, NInput } from "naive-ui";
import { ref } from "vue";

import { login } from "../../api/users";

const formRef = ref<FormInst | null>(null);
const size = ref<"small" | "medium" | "large">("medium");
const formValue = ref({
  user: {
    name: "",
    password: "",
  },
});
const rules = {
  user: {
    name: {
      required: true,
      message: "username",
      trigger: "blur",
    },
    password: {
      required: true,
      message: "password",
      trigger: ["input", "blur"],
    },
  },
};
const handleValidateClick = (e: MouseEvent) => {
  e.preventDefault();
  formRef.value?.validate((errors) => {
    if (!errors) {
      login(formValue.value.user.name, formValue.value.user.password);
    } else {
      console.log(errors);
    }
  });
};
</script>
