import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'mainmenu',
    redirect: '/home',
    //component: () => import('../components/BasicLayout/BasicLayout.vue'),
    children: [
      { 
        path: 'home', 
        name: 'home',
        component: () => import('../views/debug.vue') 
      },
      {
    path: 'course-learning',
    name: 'course-learning',
    //component: () => import('../views/CourseLearning/CreateNewCourse.vue'),
    children: [
      {
        path: 'create-new-course',
        name: 'create-new-course',
        component: () => import('../views/CourseLearning/CreateNewCourse.vue')
      },
      {
        path: 'display-course',
        name: 'display-course',
        component: () => import('../views/CourseLearning/DisplayCourse.vue')
      },
      {
        path: 'learning-course',
        name: 'learning-course',
        component: () => import('../views/CourseLearning/LearningCourse.vue')
      }
    ]
  },
  {
    path: 'coding-field',
    name: 'coding-field',
    children:[
      {
        path: 'code-visualizion-view',
        name: 'code-visualizion-view',
        component: () => import('../views/CodingField/codeVisualizationView.vue')
      },
      {
        path: 'play-ground-view',
        name: 'play-ground-view',
        component: () => import('../views/CodingField/PlaygroundView.vue')
      }
    ]
  }
    ]
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

export default router;
