<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero" :class="{ 'is-auth': isAuthed }">
      <div class="hero-inner">
        <h1 class="title">面向 C++ / 编程学习与实践的一体化平台</h1>
        <p class="subtitle">
          课程学习 · 在线编码 · 可视化调试 · 录制与分享 ——
          提升你的学习与教学效率。
        </p>
        <div class="hero-actions">
          <n-button type="primary" size="large" @click="goCoding">
            立即开始编程
          </n-button>
          <n-button size="large" tertiary @click="goCourses">浏览课程</n-button>
          <n-button v-if="!isAuthed" size="large" @click="goLogin">
            登录 / 注册
          </n-button>
          <n-button v-else size="large" @click="goProfile">个人中心</n-button>
        </div>
      </div>
      <div class="hero-bg-shape" />
    </section>

    <!-- Features Section -->
    <section class="features">
      <h2 class="section-title">核心功能亮点</h2>
      <div class="feature-grid">
        <n-card
          v-for="f in features"
          :key="f.key"
          hoverable
          :title="f.title"
          size="small"
          class="feature-card"
        >
          <template #header-extra>
            <n-icon :size="22"> <component :is="f.icon" /> </n-icon>
          </template>
          <p class="feature-desc">{{ f.desc }}</p>
        </n-card>
      </div>
    </section>

    <!-- Courses Section -->
    <section class="courses">
      <div class="courses-header">
        <h2 class="section-title">推荐课程</h2>
        <n-button text size="small" @click="goCourses">查看全部</n-button>
      </div>

      <div v-if="loading" class="course-skeleton-grid">
        <n-skeleton v-for="i in 6" :key="i" height="180px" :sharp="false" />
      </div>
      <n-empty
        v-else-if="!error && courses.length === 0"
        description="暂时没有课程"
      />
      <div v-else-if="error" class="error-box">
        <n-result status="error" title="加载失败" :description="error">
          <template #footer>
            <n-button size="small" @click="fetchCourses">重试</n-button>
          </template>
        </n-result>
      </div>
      <div v-else class="course-grid">
        <n-card
          v-for="c in courses"
          :key="c.course_id"
          hoverable
          size="small"
          class="course-card"
          @click="openCourse(c.course_id)"
        >
          <div class="cover-wrapper" v-if="c.cover_url">
            <img :src="c.cover_url" alt="cover" loading="lazy" />
          </div>
          <h3 class="course-title" :title="c.title">{{ c.title }}</h3>
          <p class="course-desc">{{ c.description || "暂无描述" }}</p>
          <div class="course-meta">
            <span>时长: {{ c.total_duration || "-" }}</span>
            <span>评分: {{ c.avg_rating || "-" }}</span>
          </div>
        </n-card>
      </div>
    </section>

    <!-- Quick Entrances -->
    <section class="quick-entry">
      <h2 class="section-title">快速入口</h2>
      <div class="entry-grid">
        <n-card hoverable size="small" @click="goCoding">
          <h3>在线编程 / 调试</h3>
          <p>进入可视化拖拽与代码运行环境。</p>
        </n-card>
        <n-card hoverable size="small" @click="goRecord">
          <h3>课程录制</h3>
          <p>使用屏幕 + 摄像头合成录制，快速产出教学视频。</p>
        </n-card>
        <n-card hoverable size="small" @click="goCourses">
          <h3>课程中心</h3>
          <p>系统化学习路径与最新课程内容。</p>
        </n-card>
        <n-card
          hoverable
          size="small"
          @click="isAuthed ? goProfile() : goLogin()"
        >
          <h3>{{ isAuthed ? "我的学习" : "登录账号" }}</h3>
          <p>
            {{ isAuthed ? "继续上次学习进度。" : "同步进度并获取全部功能。" }}
          </p>
        </n-card>
      </div>
    </section>

    <!-- Footer CTA -->
    <section class="cta">
      <div class="cta-inner">
        <h2>准备好开始了么？</h2>
        <p>立即进入编程沙盒，或挑选一个课程开始深入学习。</p>
        <div class="cta-actions">
          <n-button type="primary" @click="goCoding">打开编程环境</n-button>
          <n-button tertiary @click="goCourses">课程列表</n-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from "vue";
  import { useRouter } from "vue-router";
  import { getCourses } from "../../api/courses";
  import { NButton, NCard, NIcon, NEmpty, NSkeleton, NResult } from "naive-ui";
  import {
    BookOutline,
    CodeSlashOutline,
    VideocamOutline,
    AnalyticsOutline,
  } from "@vicons/ionicons5";

  interface CourseItem {
    course_id: number;
    title: string;
    description: string;
    instructor_id?: number;
    category?: string;
    price?: string;
    cover_url?: string;
    total_duration?: number;
    avg_rating?: string;
    status?: string;
  }

  const router = useRouter();
  const isAuthed = ref(!!localStorage.getItem("access_token"));

  const loading = ref(false);
  const error = ref<string | null>(null);
  const courses = ref<CourseItem[]>([]);

  const fetchCourses = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await getCourses();
      const data: CourseItem[] = res.data || [];
      courses.value = data.slice(0, 6);
    } catch (e: any) {
      error.value = e?.message || "获取课程失败";
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchCourses();
  });

  // Features
  const features = [
    {
      key: "course",
      title: "系统课程",
      desc: "结构化课程与进度管理，循序渐进掌握知识。",
      icon: BookOutline,
    },
    {
      key: "ide",
      title: "集成编码调试",
      desc: "可视化拖拽布局 + 在线运行/调试体验。",
      icon: CodeSlashOutline,
    },
    {
      key: "record",
      title: "录制分享",
      desc: "一键合成屏幕与摄像头画面，快速制作课程。",
      icon: VideocamOutline,
    },
    {
      key: "progress",
      title: "学习数据",
      desc: "跟踪学习进度与练习成效，数据辅助提升。",
      icon: AnalyticsOutline,
    },
  ];

  // Navigation actions
  const goCoding = () => router.push("/flexible");
  const goCourses = () => router.push("/courses");
  const goLogin = () => router.push("/login");
  const goProfile = () => router.push("/profile");
  const goRecord = () => router.push("/record");
  const openCourse = (id: number) => router.push(`/lessons/${id}`);
</script>

<style scoped>
  .home-page {
    padding-bottom: 64px;
  }

  .hero {
    position: relative;
    padding: 96px 24px 120px;
    text-align: center;
    overflow: hidden;
  }
  .hero-bg-shape {
    position: absolute;
    inset: 0;
    background: radial-gradient(
        circle at 20% 30%,
        rgba(24, 160, 88, 0.25),
        transparent 60%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(24, 160, 88, 0.15),
        transparent 60%
      );
    filter: blur(2px);
    pointer-events: none;
  }
  .hero-inner {
    max-width: 920px;
    margin: 0 auto;
    position: relative;
  }
  .title {
    font-size: 40px;
    font-weight: 700;
    line-height: 1.2;
    margin: 0 0 24px;
    background: linear-gradient(120deg, #18a058, #36ad6a, #18a058);
    -webkit-background-clip: text;
    color: transparent;
  }
  .subtitle {
    font-size: 18px;
    color: #555;
    margin: 0 auto 32px;
    max-width: 720px;
  }
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
  }

  .section-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 24px;
  }

  .features {
    padding: 56px 32px 24px;
    max-width: 1180px;
    margin: 0 auto;
  }
  .feature-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  .feature-card {
    transition: transform 0.25s, box-shadow 0.25s;
    cursor: pointer;
  }
  .feature-card:hover {
    transform: translateY(-4px);
  }
  .feature-desc {
    font-size: 13px;
    line-height: 1.5;
    color: #555;
    margin: 0;
  }

  .courses {
    padding: 32px 32px 8px;
    max-width: 1180px;
    margin: 0 auto;
  }
  .courses-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .course-skeleton-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  .course-grid {
    display: grid;
    gap: 18px;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
  .course-card {
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }
  .cover-wrapper {
    width: 100%;
    aspect-ratio: 16/9;
    overflow: hidden;
    border-radius: 6px;
    margin-bottom: 8px;
    background: #f2f2f2;
  }
  .cover-wrapper img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .course-title {
    font-size: 16px;
    font-weight: 600;
    margin: 4px 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .course-desc {
    font-size: 12px;
    line-height: 1.4;
    color: #666;
    margin: 0 0 8px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    min-height: 34px;
  }
  .course-meta {
    margin-top: auto;
    font-size: 12px;
    display: flex;
    justify-content: space-between;
    color: #888;
  }
  .error-box {
    padding: 32px 0;
  }

  .quick-entry {
    padding: 48px 32px;
    max-width: 1180px;
    margin: 0 auto;
  }
  .entry-grid {
    display: grid;
    gap: 20px;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
  .entry-grid .n-card {
    cursor: pointer;
    transition: transform 0.25s;
  }
  .entry-grid .n-card:hover {
    transform: translateY(-4px);
  }

  .cta {
    padding: 72px 24px 96px;
    text-align: center;
  }
  .cta-inner {
    max-width: 760px;
    margin: 0 auto;
    background: linear-gradient(135deg, #18a058 0%, #36ad6a 55%, #18a058 100%);
    padding: 56px 32px;
    border-radius: 24px;
    color: #fff;
    position: relative;
    overflow: hidden;
  }
  .cta-inner:before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at 30% 30%,
      rgba(255, 255, 255, 0.2),
      transparent 70%
    );
    pointer-events: none;
  }
  .cta-inner h2 {
    font-size: 32px;
    margin: 0 0 16px;
  }
  .cta-inner p {
    font-size: 16px;
    margin: 0 0 28px;
    opacity: 0.92;
  }
  .cta-actions {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  @media (max-width: 768px) {
    .title {
      font-size: 30px;
    }
    .hero {
      padding: 72px 20px 96px;
    }
    .features {
      padding: 40px 20px 8px;
    }
    .courses {
      padding: 24px 20px 0;
    }
    .quick-entry {
      padding: 40px 20px;
    }
    .cta-inner {
      padding: 48px 24px;
    }
    .cta-inner h2 {
      font-size: 26px;
    }
  }
</style>
