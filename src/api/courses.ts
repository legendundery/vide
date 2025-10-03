import newAxios from "../request";

export const getCourses = async () => {
  return await newAxios.get("api/courses");
};

export const uploadRecordedVideo = async (params: {
  course_id: number | string;
  title: string;
  sort_order?: number;
  intro_text?: string;
  homework_text?: string;
  code_timeline_json?: string;
  metadata?: any;
  video_file?: File;
  materials?: File[];
  materials_json_extra?: any[];
  pre_video_filename?: string; // 新增: 预上传后的视频文件名引用
  pre_materials_json?: any[]; // 新增: 预上传后资料 JSON 数组
}) => {
  const fd = new FormData();
  const {
    course_id,
    title,
    sort_order,
    intro_text,
    homework_text,
    code_timeline_json,
    metadata,
    video_file,
    materials,
    materials_json_extra,
    pre_video_filename,
    pre_materials_json,
  } = params;
  fd.append("course_id", String(course_id));
  fd.append("title", title);
  if (sort_order !== undefined) fd.append("sort_order", String(sort_order));
  if (intro_text) fd.append("intro_text", intro_text);
  if (homework_text) fd.append("homework_text", homework_text);
  if (code_timeline_json) fd.append("code_timeline_json", code_timeline_json);
  if (metadata)
    fd.append(
      "metadata",
      typeof metadata === "string" ? metadata : JSON.stringify(metadata)
    );
  if (pre_video_filename) fd.append("pre_video_filename", pre_video_filename);
  if (pre_materials_json && Array.isArray(pre_materials_json)) {
    fd.append("pre_materials_json", JSON.stringify(pre_materials_json));
  }
  if (video_file) fd.append("video_file", video_file);
  if (Array.isArray(materials))
    materials.forEach((f) => fd.append("materials", f));
  if (Array.isArray(materials_json_extra) && materials_json_extra.length) {
    fd.append("materials_json", JSON.stringify(materials_json_extra));
  }
  return await newAxios.post("/api/courses/lesson", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 预上传：仅视频
export const uploadVideoOnly = async (file: File) => {
  const fd = new FormData();
  fd.append("video_file", file);
  return await newAxios.post("/api/courses/video-only", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 预上传：仅资料(多文件)
export const uploadMaterialsOnly = async (files: File[]) => {
  const fd = new FormData();
  files.forEach((f) => fd.append("materials", f));
  return await newAxios.post("/api/courses/materials-only", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getCoursesSingle = async (course_id: string) => {
  return await newAxios.get("api/courses/" + course_id);
};

export const getLessons = async (course_id: string) => {
  return await newAxios.get("api/courses/lessons/" + course_id);
};

export const createLesson = async (params: any) => {
  return await newAxios.post("api/courses/lesson", params, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// 增强版：传递 intro_text / homework_text / materials / code_timeline_json
export const createLessonEnhanced = async (payload: {
  course_id: number | string;
  title: string;
  sort_order?: number;
  intro_text?: string;
  homework_text?: string;
  code_timeline_json?: string; // 已序列化 JSON
  video_file?: File;
  // 独立封装：上传录制视频与多个资料文件（若与创建课时拆分使用，可调用此函数先上传，再用返回的 materials_json）
  materials?: File[];
}) => {
  const fd = new FormData();
  fd.append("course_id", String(payload.course_id));
  fd.append("title", payload.title);
  if (payload.sort_order !== undefined)
    fd.append("sort_order", String(payload.sort_order));
  if (payload.intro_text) fd.append("intro_text", payload.intro_text);
  if (payload.homework_text) fd.append("homework_text", payload.homework_text);
  if (payload.code_timeline_json)
    fd.append("code_timeline_json", payload.code_timeline_json);
  if (payload.video_file) fd.append("video_file", payload.video_file);
  if (payload.materials) {
    payload.materials.forEach((f) => fd.append("materials", f));
  }
  return await newAxios.post("api/courses/lesson", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getLessonDetail = async (
  course_id: number | string,
  lesson_id: number | string
) => {
  return await newAxios.get(`api/courses/${course_id}/lessons/${lesson_id}`);
};

export const createCourse = async (params: any) => {
  return await newAxios.post("api/courses/", params, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// 管理端接口
export const getManageCourses = async () => {
  return await newAxios.get("api/courses/manage");
};

export const updateCourse = async (
  course_id: number | string,
  payload: any
) => {
  return await newAxios.patch(`api/courses/${course_id}`, payload);
};

export const deleteCourse = async (course_id: number | string) => {
  return await newAxios.delete(`api/courses/${course_id}`);
};

export const updateLesson = async (
  lesson_id: number | string,
  payload: any
) => {
  // 新的后端统一PUT /api/courses/lesson/:lessonId
  // payload 可能包含: title, intro_text, homework_text, sort_order, code_timeline_json,
  // pre_video_filename, pre_materials_json, materials_json, video_file, materials[]
  const fd = new FormData();
  Object.keys(payload || {}).forEach((k) => {
    const v: any = (payload as any)[k];
    if (v === undefined || v === null) return;
    if (k === "materials" && Array.isArray(v)) {
      v.forEach((f: File) => fd.append("materials", f));
    } else if (k === "video_file" && v instanceof File) {
      fd.append("video_file", v);
    } else if (
      typeof v === "object" &&
      (k === "pre_materials_json" || k === "materials_json")
    ) {
      // 允许直接传对象数组
      fd.append(k, JSON.stringify(v));
    } else {
      fd.append(k, v);
    }
  });
  return await newAxios.put(`api/courses/lesson/${lesson_id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteLesson = async (
  course_id: number | string,
  lesson_id: number | string
) => {
  return await newAxios.delete(`api/courses/${course_id}/lessons/${lesson_id}`);
};

// 删除单个资料（仅移除 lesson materials_json 中的引用）
export const deleteLessonMaterial = async (
  lesson_id: number | string,
  filename: string
) => {
  return await newAxios.delete(
    `api/courses/lesson/${lesson_id}/material/${encodeURIComponent(filename)}`
  );
};

// 课程封面更新
export const updateCourseCover = async (
  course_id: number | string,
  file: File
) => {
  const fd = new FormData();
  fd.append("cover_file", file);
  return await newAxios.patch(`api/courses/${course_id}/cover`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const removeCourseCover = async (course_id: number | string) => {
  return await newAxios.delete(`api/courses/${course_id}/cover`);
};
