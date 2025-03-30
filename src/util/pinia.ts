import { createPinia, defineStore } from "pinia";
import type { FolderItem, StorageItem } from "@/type/storage";
import type { PinStatus, UploadFileResponse } from "@/type/crust";
import { PromisePool } from "./task_pool";
import { now, uuid } from ".";

const pinia = createPinia()

type Setting = {
    user: {
        seed: string | null,
        token: string | null,
    },
    server: {
        upload: {
            use: string,
            list: string[],
        },
        download: {
            use: string,
            list: string[],
        },
        pin: {
            use: string,
            list: string[],
        }
    },
    content: FolderItem,
}

const useSettingStore = defineStore('setting', {
    state: (): Setting => ({
        user: {
            seed: null,
            token: null,
        },
        server: {
            upload: {
                use: 'https://gw.crustfiles.net',
                list: [
                    'https://gw.crustfiles.net',
                    'https://crustipfs.xyz',
                    'https://ipfs-gw.decloud.foundation',
                    'https://gw.w3ipfs.cn:10443',
                    'https://gw.smallwolf.me',
                    'https://gw.w3ipfs.com:7443',
                ],
            },
            download: {
                use: "https://ipfs.io",
                list: [
                    'https://ipfs.io',
                    'https://gw.w3ipfs.org.cn',
                    'https://crustgateway.online',
                    "https://dweb.link"
                ],
            },
            pin: {
                use: 'https://pin.crustcode.com',
                list: [
                    'https://pin.crustcode.com'
                ],
            }
        },
        content: {
            type: "folder",
            name: "root",
            size: 0,
            created: now(),
            children: []
        },
    }),
    actions: {
        addContentItem(fullPath: string, fileItem: StorageItem) {
            const pathItems = fullPath.split('/').filter(item => item !== '');
            const length = pathItems.length;

            let parentContent: StorageItem[] = this.content.children;

            // 遍历路径，自动创建不存在的文件夹
            for (let i = 0; i < length - 1; i++) {
                const folderName = pathItems[i];
                let folder = parentContent.find(
                    item => item.type === 'folder' && item.name === folderName
                ) as FolderItem | undefined;

                // 如果文件夹不存在，则创建
                if (!folder) {
                    const newFolder: FolderItem = {
                        type: "folder",
                        name: folderName,
                        size: 0,
                        created: now(),
                        children: []
                    };
                    parentContent.push(newFolder);
                    folder = newFolder;
                }

                parentContent = folder.children;
            }

            // 添加文件/文件夹到目标位置
            const targetName = pathItems[length - 1];
            const existingIndex = parentContent.findIndex(item => item.name === targetName);

            if (existingIndex !== -1) {
                // 如果已存在同名项目，替换它
                parentContent[existingIndex] = fileItem;
            } else {
                // 否则添加新项目
                parentContent.push(fileItem);
            }
        },
        getContentItem(fullPath: string): StorageItem | undefined {
            const path_items = fullPath.split('/').filter((item) => item !== '');
            const length = path_items.length;
            let content = this.content.children;
            if (length === 0) {
                return this.content;
            }
            for (let index = 0; index < length - 1; index++) {
                const folder = content?.find((item) => item.type === 'folder' && item.name === path_items[index]);
                if (!folder) {
                    return undefined;
                }
                content = (folder as FolderItem).children;
            }
            const content_item = content.find((item) => item.name === path_items[length - 1]);
            return content_item;
        },
        delContentItem(fullPath: string) {
            const pathItems = fullPath.split('/').filter(item => item !== '');
            const length = pathItems.length;

            // 无法删除根目录或空路径
            if (length === 0) return;

            let parentContent: StorageItem[] = this.content.children;

            // 遍历到目标项的父级目录
            for (let i = 0; i < length - 1; i++) {
                const folderName = pathItems[i];
                const folder = parentContent.find(
                    item => item.type === 'folder' && item.name === folderName
                ) as FolderItem | undefined;

                // 父级目录不存在，终止操作
                if (!folder) return;
                parentContent = folder.children;
            }

            // 获取目标项名称并删除
            const targetName = pathItems[length - 1];
            const targetIndex = parentContent.findIndex(item => item.name === targetName);
            if (targetIndex !== -1) {
                parentContent.splice(targetIndex, 1);
            }
        },
        moveContentItem(fullBeforePath: string, fullAfterPath: string) {
            // 检查是否尝试移动到自身子目录
            if (fullAfterPath.startsWith(fullBeforePath + '/')) {
                throw new Error('不能将项目移动到自己的子目录中');
            }

            const pathItems = fullBeforePath.split('/').filter(item => item !== '');
            if (pathItems.length === 0) return;

            let parentContent: StorageItem[] = this.content.children;

            // 获取要移动的项目
            for (let i = 0; i < pathItems.length - 1; i++) {
                const folder = parentContent.find(
                    item => item.type === 'folder' && item.name === pathItems[i]
                ) as FolderItem | undefined;
                if (!folder) return;
                parentContent = folder.children;
            }

            const targetName = pathItems[pathItems.length - 1];
            const targetIndex = parentContent.findIndex(item => item.name === targetName);

            if (targetIndex === -1) return;


            // 执行移动
            const [itemToMove] = parentContent.splice(targetIndex, 1);
            this.addContentItem(fullAfterPath, itemToMove);
        },
        importSetting(setting: Setting) {
            this.user = setting.user;
            this.server = setting.server;
            this.content = setting.content;
        }
    }
})

type TaskItem = {
    id: string,
    name: string,
    size: number,
    content: File,
    path: string,
    upload: {
        status: string,
        progress: string,
        response: UploadFileResponse | null,
    },
    pin: {
        status: string,
        response: PinStatus | null,
    }
}

function taskFromFile(path: string, file: File): TaskItem {
    return {
        id: uuid(),
        name: file.name,
        size: file.size,
        content: file,
        path: path,
        upload: {
            status: 'wait',
            progress: '0',
            response: null,
        },
        pin: {
            status: 'wait',
            response: null,
        }
    }
}

type Task = {
    pool: PromisePool,
    task_map: Map<string, TaskItem>,
    success_task_list: TaskItem[],
    failure_task_list: TaskItem[]
}

const useTaskStore = defineStore('task', {
    state: (): Task => ({
        pool: new PromisePool(5),
        task_map: new Map(),
        success_task_list: [],
        failure_task_list: [],
    }),
    actions: {
        addTask(task: TaskItem) {
            this.task_map.set(task.id, task);
        },
        updateTaskStatus(id: string, status: string) {
            const task = this.task_map.get(id);
            if (task) {
                task.upload.status = status;
            }
        },
        updateTaskProgress(id: string, progress: string) {
            const task = this.task_map.get(id);
            if (task) {
                task.upload.progress = progress;
            }
        },
        updateTaskResponse(id: string, respronse: UploadFileResponse) {
            const task = this.task_map.get(id);
            if (task) {
                task.upload.response = respronse;
            }
        },
        updateTaskPinResponse(id: string, response: PinStatus) {
            const task = this.task_map.get(id);
            if (task) {
                task.pin.response = response;
            }
        },
        updateTaskPinStatus(id: string, status: string) {
            const task = this.task_map.get(id);
            if (task) {
                task.pin.status = status;
            }
        },

    }
})

type Show = {
    user_panel: string | null,
    selected_item: string[],
}

const useShowStore = defineStore("show", {
    state: () => ({
        user_panel: null,
    }),
})

export {
    pinia,
    useSettingStore,
    type TaskItem,
    useTaskStore,
    taskFromFile,
    type Setting,
}