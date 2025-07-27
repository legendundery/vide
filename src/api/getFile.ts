import newAxios from "@/request";

export const getFile = async (filepath: string) => {
  return await newAxios.get("uploads/" + filepath, {
    responseType: "blob",
  });
};
