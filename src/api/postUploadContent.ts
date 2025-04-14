import { useSettingStore } from "@/store/setting";
import { useTaskStore } from "@/store/task";
import type { PinStatus, UploadFileResponse } from "@/type/crust";
import type { FileItem } from "@/type/setting";
import type { Task } from "@/type/task";
import { getFullPath } from "@/util";
import { axiosAuth } from "@/util/axios";
import { postPin } from "./postPin";

async function postUploadContent(task: Task) {
  const taskStore = useTaskStore();
  const settingStore = useSettingStore();
  const formData = new FormData();

  formData.append("file", task.content, task.content.name);
  try {
    taskStore.updateUploadStatus(task.id, "start");
    let res: UploadFileResponse = await axiosAuth.post(
      `https://${settingStore.setting.server.upload.use}/api/v0/add?pin=true&cid-version=1&hash=sha2-256`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            // 计算上传进度百分比
            const percentCompleted = (
              (progressEvent.loaded * 100) /
              progressEvent.total
            ).toFixed(2);
            taskStore.updateUploadProgress(task.id, percentCompleted);
          }
        },
      },
    );

    taskStore.updateUploadResponse(task.id, res);
    taskStore.updateUploadStatus(task.id, "success");

    const fullPath = getFullPath(task.path, task.content.webkitRelativePath);
    const fileItem: FileItem = {
      type: "file",
      name: task.content.name,
      size: task.content.size,
      cid: res.Hash,
      status: "fail",
      created: Date.now(),
      requestId: "",
    };
    settingStore.addStorageItem(fullPath, fileItem);

    taskStore.pinPool.add(() => postPin(task))
  } catch {
    taskStore.updateUploadStatus(task.id, "error");
  }
}

export { postUploadContent };
