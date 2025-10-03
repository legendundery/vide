import type { MenuOption } from "naive-ui";
import type { Component } from "vue";
import { RouterLink } from "vue-router";
import {
  Home,
  BookOutline as BookIcon,
  CodeSlashOutline,
  BookSharp,
  DesktopSharp,
  CreateOutline,
} from "@vicons/ionicons5";

import { NIcon } from "naive-ui";
import { h } from "vue";

// const renderIcon = function renderIcon(icon: Component) {
//   return () => h(NIcon, null, { default: () => h(icon) })
// }
export const renderIcon = (icon: Component): (() => ReturnType<typeof h>) => {
  return () => h(NIcon, null, { default: () => h(icon) });
};

// 菜单配置
export const menuOptions: MenuOption[] = [
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            path: "/",
          },
        },
        { default: () => "home" }
      ),
    key: "",
    icon: renderIcon(Home),
    //disabled: true,
  },
  {
    label: "CourseAdimin",
    key: "courses-admin",
    icon: renderIcon(DesktopSharp),
    children: [
      {
        label: () =>
          h(
            RouterLink,
            {
              to: {
                path: "/courses-admin/course-create",
              },
            },
            { default: () => "CreateCourse" }
          ),
        key: "course-create",
        icon: renderIcon(CreateOutline),
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: {
                path: "/courses-admin/lesson-create",
              },
            },
            { default: () => "CreateLesson" }
          ),
        key: "lesson-create",
        icon: renderIcon(CreateOutline),
      },

    ]
  },
  {
    label: "CourseLearning",
    key: "course-learning",
    icon: renderIcon(BookIcon),
    children: [
      {
        //type: "group",
        label: () =>
          h(
            RouterLink,
            {
              to: {
                path: "/course-learning/create-new-course",
              },
            },
            { default: () => "CreateNewCourse" }
          ),
        key: "create-new-course",
        icon: renderIcon(BookSharp),
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: {
                path: "/course-learning/display-course",
              },
            },
            { default: () => "DisplayCourse" }
          ),
        key: "display-course",
        icon: renderIcon(BookSharp),
      },
      {
        label: () =>
          h(
            RouterLink,
            {
              to: {
                path: "/course-learning/learning-course",
              },
            },
            { default: () => "LearningCourse" }
          ),
        key: "learning-course",
        icon: renderIcon(BookSharp),
      },
    ],
  },
  {
    label: () =>
      h(
        RouterLink,
        {
          to: {
            path: "/flexible",
          },
        },
        { default: () => "CodingField" }
      ),
    key: "/coding-field",
    icon: renderIcon(CodeSlashOutline),
  },
];
