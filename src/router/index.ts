import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "mainmenu",
    component: () => import("../components/BasicLayout/BasicLayout.vue"),
    children: [
      {
        path: "course-learning",
        name: "course-learning",
        //component: () => import('../views/CourseLearning/CreateNewCourse.vue'),
        children: [
          {
            path: "create-new-course",
            name: "create-new-course",
            component: () =>
              import("../views/CourseLearning/CreateNewCourse.vue"),
          },
          {
            path: "display-course",
            name: "display-course",
            component: () =>
              import("../views/CourseLearning/DisplayCourse.vue"),
          },
          {
            path: "learning-course",
            name: "learning-course",
            component: () =>
              import("../views/CourseLearning/LearningCourse.vue"),
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
      },
      {
        path: "/",
        name: "home",
        component: () => import("../views/debug.vue"),
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
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem("access_token");

  if (to.meta.requiresAuth && !isAuthenticated) {
    next("/login");
  } else if (to.name === "login" && isAuthenticated) {
    next("/profile");
  } else {
    next();
  }
});

export default router;
