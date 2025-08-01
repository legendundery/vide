<template>
  <div v-for="singleCourse in courses">
    <RouterLink :to="'/lessons/id:' + singleCourse.course_id">
      lessons
    </RouterLink>
    <br />
    id:
    {{ singleCourse.course_id }}
    title:
    {{ singleCourse.title }}
    description:
    {{ singleCourse.description }}
    instructor_id:
    {{ singleCourse.instructor_id }}
    cover:
    <img :src="singleCourse.cover_url" alt="" height="100px" />
    {{ singleCourse.cover_url }}
    total_duration:
    {{ singleCourse.total_duration }}
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

import { getCourses } from "../../api/courses";

interface course {
  course_id: Number;
  title: string;
  description: string;
  instructor_id: Number;
  category: string;
  price: string;
  cover_url: string;
  total_duration: Number;
  avg_rating: string;
  status: string;
  created_at: string;
  updated_at: string;
}
const courses = ref([{} as course]);
onMounted(() => {
  getCourses().then((result) => {
    courses.value = result.data as unknown as Array<course>;
  });
});
</script>
