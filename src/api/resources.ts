import newAxios from "../request";

// 上传资料(多文件)
export const uploadMaterials = async (files: File[]) => {
  const fd = new FormData();
  files.forEach((f) => fd.append("materials", f));
  return await newAxios.post("/api/materials", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 列表查询
export const listMaterials = async (
  params: {
    page?: number;
    pageSize?: number;
    ext?: string;
    mime?: string;
    kw?: string;
  } = {}
) => {
  return await newAxios.get("/api/materials", { params });
};

// 删除 (soft)  force=1 物理
export const deleteMaterial = async (id: number | string, force = false) => {
  return await newAxios.delete(`/api/materials/${id}`, {
    params: { force: force ? "1" : undefined },
  });
};
