import { useSettingStore } from "@/store/setting";
import { useTaskStore } from "@/store/task";
import type { PinStatus } from "@/type/crust";
import type { FileItem } from "@/type/setting";
import type { Task } from "@/type/task";
import { axiosAuth } from "@/util/axios";


async function postRePin(task: Task) {
  const taskStore = useTaskStore();
  const settingStore = useSettingStore();
  taskStore.updatePinStatus(task.id, "wait");
  const res = task.upload.response;
  if (res === null) {
    alert(`${task.name}: 未能获取cid和name`);
    return;
  }
  try {
    let cid = res.Hash;
    let name = res.Name;
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
  if (task.pin.status === 'success' && task.upload.status === "success") {
    taskStore.successTaskList.push(task);
  } else {
    taskStore.failedTaskList.push(task);
  }
  taskStore.taskMap.delete(task.id);
}

export {
  postRePin,
}
