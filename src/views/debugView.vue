<template>
  <div class="container">
    <form>
      <input type="file" @change="uploadFile($event)" />
      <a-button @click="submitForm($event)">submit</a-button>
    </form>
    <img :src="imgURL" alt="display" />
  </div>
</template>

<script lang="ts" setup>
import { submitFile } from "../api/submitFile";
import { getFile } from "../api/getFile";
import { ref } from "vue";

const imgURL = ref("");

var file: Blob;
const uploadFile = (event: any) => {
  file = event.target.files[0];
  console.log(file);
};

const submitForm = (event: any) => {
  event.preventDefault();
  var formData = new FormData();
  formData.append("file", file);
  submitFile(formData)
    .then((res) => {
      console.log("上传成功", res);
      if (res)
        getFile(res).then((resFile) => {
          const blob = new Blob([resFile.data]);
          imgURL.value = URL.createObjectURL(blob);
          console.log(imgURL);
        });
    })
    .catch((error) => {
      console.error("上传失败", error);
    });
};
</script>

<style scoped></style>
