import newAxios from "../request.ts";

export const getFile = async (filepath: string) => {
  return await newAxios.get("uploads/" + filepath, {
    responseType: "blob",
  });
};
