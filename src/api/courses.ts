import newAxios from "../request";

export const getCourses = async () => {
  return await newAxios.get("api/courses");
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

export const createCourse = async (params: any) => {
  return await newAxios.post("api/courses/", params, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}
