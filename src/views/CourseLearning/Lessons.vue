<template>
  <div>{{ crtCourse }}</div>

  <div v-for="lesson in crtLessons">
    {{ lesson }}
    <video :src="lesson.video_url" controls></video>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";

import { getCoursesSingle, getLessons } from "../../api/courses";

const route = useRoute();

const id = route.params.id;

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

interface lesson {
  lesson_id: Number;
  course_id: Number;
  title: string;
  video_url: string;
  duration: Number;
  sort_order: Number;
}

const crtCourse = ref({} as course);
const crtLessons = ref([{} as lesson]);

onMounted(() => {
  getCoursesSingle(id as string).then((result) => {
    crtCourse.value = result.data;
  });
  getLessons(id as string).then((result) => {
    crtLessons.value = result.data as unknown as Array<lesson>;
  });
});
</script>
