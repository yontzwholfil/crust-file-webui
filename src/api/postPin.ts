import { useSettingStore } from "@/store/setting";
import { useTaskStore } from "@/store/task";
import type { PinStatus, UploadFileResponse } from "@/type/crust";
import type { FileItem } from "@/type/setting";
import type { Task } from "@/type/task";
import { getFullPath } from "@/util";
import { axiosAuth } from "@/util/axios";

async function postPin(task: Task) {
  const taskStore = useTaskStore();
  const settingStore = useSettingStore();

  taskStore.updatePinStatus(task.id, "wait");

  if (!task.upload.response) {
    taskStore.updateUploadStatus(task.id, "error");
    alert(`${task.name}: 未能获取cid和name`);
    return;
  }

  try {
    const cid = task.upload.response.Hash;
    const name = task.upload.response.Name;
    taskStore.updatePinStatus(task.id, "start");
    const pinRes: PinStatus = await axiosAuth.post(
      `https://${settingStore.setting.server.pin.use}/psa/pins`,
      {
        cid: cid,
        name: name,
      },
    );
    taskStore.updatePinResponse(task.id, pinRes);
    taskStore.updatePinStatus(task.id, "success");

    const fullPath = getFullPath(task.path, task.content.webkitRelativePath);
    settingStore.updateFileItemRequestId(fullPath, pinRes.requestId);
  } catch {
    taskStore.updatePinStatus(task.id, "error");
  }

  if (task.pin.status === "success" && task.upload.status === "success") {
    taskStore.successTaskList.push(task);
  } else {
    taskStore.failedTaskList.push(task);
  }
  taskStore.taskMap.delete(task.id);
}

export { postPin };
