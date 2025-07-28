import newAxios from "../request.ts";

export const submitFile = async (file: FormData) => {
  return await newAxios
    .post("upload", file, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => {
      console.log("上传成功", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("上传失败", error);
    });
};
