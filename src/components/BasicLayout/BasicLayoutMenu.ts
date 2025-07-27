import type { MenuOption } from 'naive-ui'
import type { Component } from 'vue'
import {
  BookOutline as BookIcon,
  CodeSlashOutline,
  BookSharp
} from '@vicons/ionicons5'


import { NIcon } from 'naive-ui'
import { h, } from 'vue'

// const renderIcon = function renderIcon(icon: Component) {
//   return () => h(NIcon, null, { default: () => h(icon) })
// }
export const renderIcon = (icon: Component): (() => ReturnType<typeof h>) => {
  return () => h(NIcon, null, { default: () => h(icon) })
}

// 菜单配置
export const menuOptions: MenuOption[] = [
  {
    label: "且听风吟（还没做）",
    key: "/index",
    icon: renderIcon(BookIcon),
    //disabled: true,
  },
  {
    label: "CourseLearning",
    key: "/course-learning",
    icon: renderIcon(BookIcon),
    children: [
      {
        //type: "group",
        label: "CreateNewCourse",
        key: "create-new-course",
        icon: renderIcon(BookSharp),
      },
      {
        label: "DisplayCourse",
        key: "display-course",
        icon: renderIcon(BookSharp),
      },
      {
        label: "LearningCourse",
        key: "learning-course",
        icon: renderIcon(BookSharp),
      },
    ]
  },
  {
    label: "CodingField",
    key: "/coding-field",
    icon: renderIcon(CodeSlashOutline),
    children: [
        {
            label: "playGroundView",
            key: "play-ground-view",
            icon: renderIcon(CodeSlashOutline),
        },
        {
            label: "codeVisualizionView",
            key: "code-visualizion-view",
            icon: renderIcon(CodeSlashOutline),
        }
    ]
  }
];
