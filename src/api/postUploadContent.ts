import { useSettingStore } from "@/store/setting";
import { useTaskStore } from "@/store/task";
import type { PinStatus, UploadFileResponse } from "@/type/crust";
import type { FileItem } from "@/type/setting";
import type { Task } from "@/type/task";
import { axiosAuth } from "@/util/axios";

async function postUploadContent(task: Task) {
  const taskStore = useTaskStore();
  const settingStore = useSettingStore();
  const formData = new FormData();

  formData.append('file', task.content, task.content.name);
  try {
    taskStore.updateUploadStatus(task.id, 'start');
    let res: UploadFileResponse = await axiosAuth.post(`https://${settingStore.setting.server.upload.use}/api/v0/add?pin=true&cid-version=1&hash=sha2-256`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          // 计算上传进度百分比
          const percentCompleted = ((progressEvent.loaded * 100) / progressEvent.total).toFixed(2);
          taskStore.updateUploadProgress(task.id, percentCompleted);
        }
      },
    });

    taskStore.updateUploadResponse(task.id, res);
    taskStore.updateUploadStatus(task.id, 'success');

    try {
      const cid = res.Hash;
      const name = res.Name;
      taskStore.updatePinStatus(task.id, "start");
      const pinRes: PinStatus = await axiosAuth.post(`https://${settingStore.setting.server.pin.use}/psa/pins`, {
        cid: cid,
        name: name,
      });
      taskStore.updatePinResponse(task.id, pinRes);
      taskStore.updatePinStatus(task.id, "success");

      const fullPath = `/${task.path}/${task.content.webkitRelativePath}`.replace(/\/+/g, '/');
      const fileItem: FileItem = {
        type: 'file',
        name: task.content.name,
        size: task.content.size,
        created: Date.now(),
        cid: cid,
        requestId: pinRes.requestId,
      }
      settingStore.addStorageItem(fullPath, fileItem);
    } catch {
      taskStore.updatePinStatus(task.id, "error");
    }
  } catch {
    taskStore.updateUploadStatus(task.id, 'error');
  }
  if (task.pin.status === 'success' && task.upload.status === "success") {
    taskStore.successTaskList.push(task);
  } else {
    taskStore.failedTaskList.push(task);
  }
  taskStore.taskMap.delete(task.id);

}


export {
  postUploadContent,
}
