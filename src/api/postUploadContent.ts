import type { PinStatus, UploadFileResponse } from "@/type/crust";
import type { FileItem, StorageItem } from "@/type/storage";
import { now } from "@/util";
import { axiosAuth } from "@/util/axios";
import { useSettingStore, useTaskStore, type TaskItem } from "@/util/pinia";

async function postUploadContent(task: TaskItem) {
    const taskStore = useTaskStore();
    const settingStore = useSettingStore();
    const formData = new FormData();

    formData.append('file', task.content, task.content.name);
    try {
        taskStore.updateTaskStatus(task.id, 'start');
        let res: UploadFileResponse = await axiosAuth.post(`${settingStore.server.upload.use}/api/v0/add?pin=true&cid-version=1&hash=sha2-256`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    // 计算上传进度百分比
                    const percentCompleted = ((progressEvent.loaded * 100) / progressEvent.total).toFixed(2);
                    taskStore.updateTaskProgress(task.id, percentCompleted);
                }
            },
        });

        taskStore.updateTaskResponse(task.id, res);
        taskStore.updateTaskStatus(task.id, 'success');

        try {
            const cid = res.Hash;
            const name = res.Name;
            taskStore.updateTaskPinStatus(task.id, "start");
            const pinRes: PinStatus = await axiosAuth.post(`${settingStore.server.pin.use}/psa/pins`, {
                cid: cid,
                name: name,
            });
            taskStore.updateTaskPinResponse(task.id, pinRes);
            taskStore.updateTaskPinStatus(task.id, "success");

            const fullPath = `/${task.path}/${task.content.webkitRelativePath}`.replace(/\/+/g, '/');
            const fileItem: FileItem = {
                type: 'file',
                name: task.content.name,
                size: task.content.size,
                created: now(),
                cid: cid,
                request_id: pinRes.requestId,
            }
            settingStore.addContentItem(fullPath, fileItem);
        } catch {
            taskStore.updateTaskPinStatus(task.id, "fail");
        }
    } catch {
        taskStore.updateTaskStatus(task.id, 'fail');
    }
    if (task.pin.status === 'success' && task.upload.status === "success") {
        taskStore.success_task_list.push(task);
    } else {
        taskStore.failure_task_list.push(task);
    }
    taskStore.task_map.delete(task.id);

}


export {
    postUploadContent,
}