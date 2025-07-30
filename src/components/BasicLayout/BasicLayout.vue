<template>
  <n-config-provider :theme-overrides="Theme">
    <n-layout class="app-layout" has-sider>
      <!-- 侧边栏 -->
      <n-layout-sider :width="64" class="sidebar" bordered>
        <!-- 侧边栏头部 -->
        <div class="sidebar-header">
          <menu-outline />
        </div>

        <!-- 侧边栏菜单 -->
        <n-menu
          v-model:value="activeKey"
          :collapsed="true"
          :collapsed-width="64"
          :collapsed-icon-size="22"
          :options="menuOptions"
        />
      </n-layout-sider>
      <!-- 主内容区 -->
      <n-layout name="main">
        <!-- 顶部导航栏 -->
        <n-layout-header class="header" bordered>
          <div class="header-left">
            <!-- 搜索框 -->
            <n-input
              v-model:value="searchQuery"
              placeholder="搜索..."
              size="small"
              class="search-input"
            >
              <template #prefix>
                <n-icon size="16"><search-outline /></n-icon>
              </template>
            </n-input>
          </div>

          <div class="header-right">
            <!-- 通知图标 -->
            <n-badge :value="3" dot>
              <n-button size="small" circle>
                <n-icon><notifications-outline /></n-icon>
              </n-button>
            </n-badge>

            <!-- 用户菜单 -->
            <n-dropdown :options="useroptions">
              <n-button round class="user-button">
                <n-avatar size="small" class="mr-2">
                  <img
                    src="https://picsum.photos/id/1005/200/200"
                    alt="用户头像"
                  />
                </n-avatar>
                <span>用户名</span>
              </n-button>
            </n-dropdown>
          </div>
        </n-layout-header>

        <!-- 页面内容区域 -->
        <n-layout-content class="content">
          <div class="router-view-wrapper">
            <router-view></router-view>
          </div>
        </n-layout-content>

        <!-- 页脚 -->
        <n-layout-footer class="footer">
          © 2025 webide 版权所有
        </n-layout-footer>

        <n-back-top :right="50" />
      </n-layout>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { menuOptions, renderIcon } from "./BasicLayoutMenu.ts";
import { useRoute } from "vue-router";
import {
  NBackTop,
  NConfigProvider,
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NLayoutFooter,
  NMenu,
  NButton,
  NInput,
  NBadge,
  NAvatar,
  NDropdown,
  NIcon,
} from "naive-ui";
import {
  MenuOutline,
  SearchOutline,
  NotificationsOutline,
  Pencil as EditIcon,
  LogOutOutline as LogoutIcon,
  PersonCircleOutline as UserIcon,
} from "@vicons/ionicons5";

import router from "../../router";

// 状态管理
const activeMenu = ref("");
const searchQuery = ref("");
const route = useRoute();
const activeKey = ref<string | null>(null);

// 主题配置
const Theme = ref({
  common: {
    primaryColor: "#18a058",
  },
});

// 初始化
onMounted(() => {
  activeMenu.value = route.path;
});

// 监听路由变化
watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath;
  }
);

//用户选项：
const useroptions = [
  {
    label: "用户资料",
    key: "profile",
    icon: renderIcon(UserIcon),
    props: {
      onClick: () => {
        router.push("profile");
      },
    },
  },
  {
    label: "编辑用户资料",
    key: "editProfile",
    icon: renderIcon(EditIcon),
  },
  {
    label: "退出登录",
    key: "logout",
    icon: renderIcon(LogoutIcon),
    props: {
      onClick: () => {
        localStorage.removeItem("access_token");
        router.push("/");
      },
    },
  },
];
</script>

<style scoped>
.app-layout {
  height: 100vh;
}

.sidebar {
  background-color: #fff;
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 64px;
  border-bottom: 1px solid #eee;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 18px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 64px;
  background-color: #fff;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 240px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-button {
  padding: 6px 12px;
}

.content {
  padding: 20px;
  min-height: calc(100% - 115px);
  overflow: auto;
  background-color: #f5f7fa;
}

.footer {
  text-align: center;
  padding: 12px;
  background-color: #fff;
  border-top: 1px solid #eee;
}

/*路由显示页面：*/
.content-container {
  /* 确保父容器有明确尺寸（根据你的布局调整） */
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
}

/* 可选：自定义滚动条样式 */
.router-view-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.router-view-wrapper::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 4px;
}

.router-view-wrapper::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}
</style>
