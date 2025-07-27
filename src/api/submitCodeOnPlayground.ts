import newAxios from "../request";

export const compileCpp = async (params: any) => {
  return await newAxios.post("api/compile/cpp", params, {});
};
export const debugCpp = async (params: any) => {
  return await newAxios.post("api/debug/cpp", params, {});
};
/*

 */
/*
fetch("http://192.168.230.1:1437/api/compile/cpp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: params,
  });
*/
