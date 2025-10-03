import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";
import { UserStore } from "../stores/UserStore";
import { profile } from "../api/users";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "mainmenu",
    component: () => import("../components/BasicLayout/BasicLayout.vue"),
    children: [
      {
        path: "lesson-player/:courseId/:lessonId",
        name: "lesson-player",
        component: () => import("../views/CourseLearning/LessonPlayer.vue"),
        props: true,
      },
      {
        path: "course-learning",
        name: "course-learning",
        children: [
          {
            path: "browse-courses",
            name: "browse-courses",
            component: () => import("../views/CourseLearning/Courses.vue"),
          },
          // 动态课程页：复用同一个组件，通过 courseId 拉取不同数据
          {
            path: "browse-courses/:courseId",
            name: "browse-course-detail",
            component: () => import("../views/CourseLearning/Courses.vue"),
            props: true, // 让组件以 props 接收 route.params.courseId
          },
          {
            path: "browse-lessons/:id",
            name: "browse-lessons",
            component: () => import("../views/CourseLearning/Lessons.vue"),
            props: true,
          },
        ],
      },
      {
        path: "coding-field",
        name: "coding-field",
        children: [
          {
            path: "code-visualizion-view",
            name: "code-visualizion-view",
            component: () => import("../components/DragLayOut/DragLayOut.vue"),
          },
          {
            path: "playground-view",
            name: "playground-view",
            component: () => import("../views/debug.vue"),
          },
        ],
      },
      {
        path: "courses-admin",
        name: "courses-admin",
        children: [
          {
            path: "dashboard",
            name: "courses-dashboard",
            component: () => import("../views/CourseAdmin/CourseDashboard.vue"),
            meta: { requiresAuth: true, roles: ["admin", "teacher"] },
          },
          {
            path: "course-create",
            name: "course-create",
            component: () => import("../views/CourseAdmin/CourseCreate.vue"),
            meta: { requiresAuth: true, roles: ["admin", "teacher"] },
          },
          {
            path: "lesson-create",
            name: "lesson-create",
            component: () => import("../views/CourseAdmin/LessonCreate.vue"),
            meta: { requiresAuth: true, roles: ["admin", "teacher"] },
          },
          {
            path: "lesson-edit/:courseId/:lessonId",
            name: "lesson-edit",
            component: () => import("../views/CourseAdmin/LessonCreate.vue"),
            props: true,
            meta: { requiresAuth: true, roles: ["admin", "teacher"] },
          },
          {
            path: "manage/:courseId",
            name: "course-manage",
            component: () => import("../views/CourseAdmin/CourseManage.vue"),
            props: true,
            meta: { requiresAuth: true, roles: ["admin", "teacher"] },
          },
        ],
      },
      {
        path: "login",
        name: "login",
        component: () => import("../views/users/login.vue"),
      },
      {
        path: "profile",
        name: "profile",
        component: () => import("../views/users/profile.vue"),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: "admin",
        name: "admin",
        component: () => import("../views/admin/index.vue"),
        meta: {
          requiresAuth: true,
          roles: ["admin"],
        },
      },
      {
        path: "courses",
        name: "courses",
        component: () => import("../views/CourseLearning/Courses.vue"),
      },
      // 动态课程详情（复用组件）：/courses/123
      {
        path: "courses/:courseId",
        name: "course-detail",
        component: () => import("../views/CourseLearning/Courses.vue"),
        props: true,
      },
      {
        path: "lessons/:id",
        name: "lessons",
        component: () => import("../views/CourseLearning/Lessons.vue"),
        props: true,
      },
      {
        path: "/",
        name: "home",
        component: () => import("../views/home/Home.vue"),
      },
      {
        path: "record",
        name: "record",
        component: () => import("../components/Video/videoVue.vue"),
      },
    ],
  },
  {
    path: "/flexible",
    name: "flexible",
    component: () => import("../components/DragLayOut/DragLayOut.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition;
    else return { top: 0 };
  },
});

// 路由守卫
let profileLoaded = false;
router.beforeEach(async (to, _from, next) => {
  let store: any = null;
  try {
    store = UserStore();
  } catch (e) {
    store = { role: "" };
  }
  const token = localStorage.getItem("access_token");
  const isAuthenticated = !!token;

  // 登录状态首次加载用户信息
  if (isAuthenticated && !profileLoaded) {
    try {
      await profile();
      profileLoaded = true;
    } catch (e) {
      // token 失效，强制登出
      store.clearSession();
    }
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next("/login");
  }

  if (to.name === "login" && isAuthenticated) {
    return next("/profile");
  }

  // 角色控制
  const roles = to.meta.roles as string[] | undefined;
  if (roles && roles.length > 0) {
    if (!roles.includes(store.role)) {
      return next("/");
    }
  }
  next();
});

export default router;
