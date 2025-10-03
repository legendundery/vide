<template>
  <n-card style="max-width:420px;margin:60px auto" :title="mode==='login'?'登录':'注册'">
    <n-tabs type="segment" v-model:value="mode" animated>
      <n-tab name="login" tab="登录" />
      <n-tab name="register" tab="注册" />
    </n-tabs>
    <n-form ref="formRef" :model="form" :rules="rules" label-placement="left" :show-require-mark="false">
      <n-form-item label="用户名" path="username">
        <n-input v-model:value="form.username" placeholder="请输入用户名" />
      </n-form-item>
      <n-form-item v-if="mode==='register'" label="邮箱" path="email">
        <n-input v-model:value="form.email" placeholder="请输入邮箱" />
      </n-form-item>
      <n-form-item label="密码" path="password">
        <n-input v-model:value="form.password" type="password" show-password-on="mousedown" placeholder="请输入密码" />
      </n-form-item>
      <n-form-item v-if="mode==='register'" label="角色" path="role">
        <n-select v-model:value="form.role" :options="roleOptions" />
      </n-form-item>
      <n-space justify="space-between" style="width:100%">
        <n-button type="primary" @click="handleSubmit" :loading="loading">
          {{ mode==='login' ? '登录' : '注册并登录' }}
        </n-button>
        <n-button secondary @click="reset">重置</n-button>
      </n-space>
      <n-alert v-if="errorMsg" type="error" style="margin-top:16px">{{ errorMsg }}</n-alert>
      <n-alert v-if="successMsg" type="success" style="margin-top:16px">{{ successMsg }}</n-alert>
    </n-form>
  </n-card>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { NCard, NForm, NFormItem, NInput, NButton, NTabs, NTab, NSelect, NSpace, NAlert } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import { login as apiLogin, registeruser, profile } from '../../api/users'
import { UserStore } from '../../stores/UserStore'

const userStore = UserStore()
const router = useRouter()
const formRef = ref<FormInst|null>(null)
const mode = ref<'login' | 'register'>('login')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const message = useMessage()

interface LoginRegisterForm {
  username: string
  email?: string
  password: string
  role: string
}

const form = ref<LoginRegisterForm>({
  username: '',
  email: '',
  password: '',
  role: 'student'
})

const roleOptions = [
  { label: '学生', value: 'student' },
  { label: '管理员', value: 'admin' },
  { label: '讲师', value: 'teacher' }
]

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    {
      validator: (_r, v: string) => {
        if (mode.value === 'register' && !v) return new Error('请输入邮箱')
        return true
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '至少 6 位', trigger: 'blur' }
  ],
  role: [
    {
      validator: (_r, v: string) => {
        if (mode.value === 'register' && !v) return new Error('请选择角色')
        return true
      },
      trigger: 'change'
    }
  ]
}

function reset(){
  form.value = { username: '', email: '', password: '', role: 'student' }
  errorMsg.value=''; successMsg.value=''
}

async function handleSubmit(){
  errorMsg.value=''; successMsg.value='';
  try {
    await formRef.value?.validate()
    loading.value = true
    if(mode.value==='login'){
      await apiLogin(form.value.username, form.value.password)
      successMsg.value='登录成功'
      message.success('登录成功，正在刷新界面…',{duration:1000})
    } else {
      await registeruser(form.value.username, form.value.email!, form.value.role, form.value.password)
      successMsg.value='注册成功，自动登录中'
      message.success('注册成功，自动登录…',{duration:1200})
      await apiLogin(form.value.username, form.value.password)
    }
    await profile()
    // 根据角色跳转
    const target = userStore.isAdmin ? '/admin' : '/'
    router.push(target)
    // 延迟刷新确保路由跳转后组件重新渲染角色菜单
    setTimeout(()=> window.location.reload(), 300)
  } catch(e:any){
    if(Array.isArray(e)){
      errorMsg.value = e[0]?.message || '表单验证失败'
    } else {
      const backendErr = e?.response?.data?.error
      if(backendErr === '无效的用户名或密码'){
        errorMsg.value = '用户不存在或密码错误'
        message.error('用户不存在或密码错误',{duration:1500})
      } else {
        errorMsg.value = backendErr || e.message || '操作失败'
        message.error(errorMsg.value,{duration:2000})
      }
    }
  } finally {
    loading.value = false
  }
}
</script>
