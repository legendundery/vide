import type { MenuOption } from "naive-ui";
import type { Component } from "vue";
import { RouterLink } from "vue-router";
import {
  Home,
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
export function buildMenu(role: string | null | undefined): MenuOption[] {
  const base: MenuOption[] = [
    {
      label: () =>
        h(RouterLink, { to: { path: "/" } }, { default: () => "Home" }),
      key: "home",
      icon: renderIcon(Home),
    },
    {
      label: () =>
        h(
          RouterLink,
          { to: { path: "/flexible" } },
          { default: () => "CodingField" }
        ),
      key: "coding-field",
      icon: renderIcon(CodeSlashOutline),
    },
  ];

  // 管理员与教师：添加课程管理
  if (role === "admin" || role === "teacher") {
    base.push({
      label: "CourseAdmin",
      key: "courses-admin",
      icon: renderIcon(DesktopSharp),
      children: [
        {
          label: () =>
            h(
              RouterLink,
              { to: { path: "/courses-admin/dashboard" } },
              { default: () => "Dashboard" }
            ),
          key: "courses-dashboard",
          icon: renderIcon(DesktopSharp),
        },
        {
          label: () =>
            h(
              RouterLink,
              { to: { path: "/courses-admin/course-create" } },
              { default: () => "CreateCourse" }
            ),
          key: "course-create",
          icon: renderIcon(CreateOutline),
        },
      ],
    });
  }

  // 仅管理员：加入后台入口
  if (role === "admin") {
    base.push({
      label: () =>
        h(RouterLink, { to: { path: "/admin" } }, { default: () => "Admin" }),
      key: "admin",
      icon: renderIcon(BookSharp),
    });
  }
  return base;
}
