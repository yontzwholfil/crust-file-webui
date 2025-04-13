<script lang="ts" setup>
import { useRoute } from "vue-router";
import { ref, watch, computed, onMounted } from "vue";
import {
    AiOutlineClose,
    AiOutlineCloudDownload,
    AiOutlineCloudUpload,
    AiOutlineDelete,
    AiOutlineFile,
    AiOutlineFolder,
    AiOutlineSetting,
} from "vue-icons-plus/ai";
import { BiMove } from "vue-icons-plus/bi";
import deleteComp from "@/component/deleteComp.vue";
import downloadComp from "@/component/downloadComp.vue";
import moveComp from "@/component/moveComp.vue";
import settingComp from "@/component/settingComp.vue";
import uploadComp from "@/component/uploadComp.vue";
import { downloadFile, formatSize, formatTimestamp, getFullPath } from "@/util";
import { useSettingStore } from "@/store/setting";
import type { FolderItem, StorageItem } from "@/type/setting";

// 基础元素
const route = useRoute();
const settingStore = useSettingStore();

// 界面展示
const currentStorageItem = ref<StorageItem | null>(null); // 当前界面
const currentPathItemList = ref<{ name: string; path: string }[]>([]); // 当前路径
const updateCurrentStorageItem = () => {
    const path = decodeURIComponent(window.location.pathname);
    const storageItem = settingStore.getStorageItem(path);
    currentStorageItem.value = storageItem;
};
const updateCurrentPathItemList = () => {
    const path = decodeURIComponent(window.location.pathname);
    const segments = path.split("/").filter((item) => item !== "");
    const crumbs = [{ name: "home", path: "/" }];

    let accumulatedPath = "";
    for (const segment of segments) {
        accumulatedPath += `/${segment}`;
        crumbs.push({
            name: segment,
            path: accumulatedPath,
        });
    }
    currentPathItemList.value = crumbs;
};

// 选择框
const selectStorageItemList = ref<string[]>([]);
const selectAllStorageItem = () => {
    const selectLength = selectStorageItemList.value.length;
    const totalLength = (currentStorageItem.value as FolderItem).children
        .length;
    if (selectLength === totalLength) {
        selectStorageItemList.value = [];
    } else {
        selectStorageItemList.value = (
            currentStorageItem.value as FolderItem
        ).children.map((item) => item.name);
    }
};
const selectStorageItem = (storageItemName: string) => {
    const index = selectStorageItemList.value.indexOf(storageItemName);
    if (index === -1) {
        selectStorageItemList.value.push(storageItemName);
    } else {
        selectStorageItemList.value.splice(index, 1);
    }
};

// 功能面板
type functionType =
    | "upload"
    | "delete"
    | "download"
    | "move"
    | "setting"
    | null;
const functionActive = ref<functionType>(null);
const activeFunction = (choose: functionType) => {
    functionActive.value = choose;
};

// 初始化
onMounted(async () => {
    updateCurrentStorageItem();
    updateCurrentPathItemList();
});

// 变量监听
watch(
    () => route.path,
    async () => {
        updateCurrentStorageItem();
        updateCurrentPathItemList();
        selectStorageItemList.value = []
    },
);
</script>

<template>
    <div class="container">
        <!-- 顶部导航栏 -->
        <header class="app-bar">
            <div class="path-display">
                <router-link to="/">
                    <img src="/src/asset/image/favicon.ico" class="logo" alt="Logo" />
                </router-link>
                <nav class="breadcrumb">
                    <template v-for="(crumb, index) in currentPathItemList" :key="crumb.path">
                        <router-link :to="crumb.path" class="crumb-link" :class="{
                            'last-crumb':
                                index === currentPathItemList.length - 1,
                        }">
                            {{ crumb.name }}
                        </router-link>
                        <span v-if="index < currentPathItemList.length - 1" class="separator">/</span>
                    </template>
                </nav>
            </div>
            <div class="right-group">
                <div class="storage-actions">
                    <button class="action-item" @click="activeFunction('download')"
                        :disabled="selectStorageItemList.length === 0" aria-label="下载选中项目">
                        <AiOutlineCloudDownload />
                        <span class="tooltip">下载</span>
                    </button>

                    <button class="action-item" @click="activeFunction('move')"
                        :disabled="selectStorageItemList.length === 0" aria-label="移动选中项目">
                        <BiMove />
                        <span class="tooltip">移动</span>
                    </button>

                    <button class="action-item" @click="activeFunction('delete')"
                        :disabled="selectStorageItemList.length === 0" aria-label="删除选中项目">
                        <AiOutlineDelete />
                        <span class="tooltip">删除</span>
                    </button>

                    <button class="action-item" @click="activeFunction('upload')" aria-label="上传文件"
                        v-show="currentStorageItem?.type !== 'file'">
                        <AiOutlineCloudUpload />
                        <span class="tooltip">上传</span>
                    </button>

                    <button class="action-item" @click="activeFunction('setting')" aria-label="设置">
                        <AiOutlineSetting />
                        <span class="tooltip">设置</span>
                    </button>
                </div>

                <div class="search-box">
                    <input type="text" placeholder="搜索文件..." class="search-input" />
                </div>
            </div>
        </header>

        <!-- 文件内容展示区 -->
        <main class="content-area">
            <!-- 错误状态 -->
            <div v-if="currentStorageItem === null" class="error-state">
                <p>路径不存在或包含非法文件类型</p>
            </div>

            <!-- 文件视图 -->
            <section v-else-if="currentStorageItem.type === 'file'" class="file-view">
                <div class="file-meta">
                    <h2>{{ currentStorageItem.name }}</h2>
                    <p>文件大小：{{ formatSize(currentStorageItem.size) }}</p>
                    <p>
                        创建时间：{{
                            formatTimestamp(currentStorageItem.created)
                        }}
                    </p>
                </div>
                <button class="download-btn" @click="
                    downloadFile(
                        `https://${settingStore.setting.server.download.use}/ipfs/${currentStorageItem.cid}?filename=${encodeURIComponent(currentStorageItem.name)}`,
                        currentStorageItem.name,
                    )
                    ">
                    下载文件
                </button>
            </section>

            <!-- 文件夹视图 -->
            <table v-else-if="currentStorageItem.type === 'folder'" class="file-table">
                <thead>
                    <tr>
                        <th class="checkbox-cell">
                            <input type="checkbox" :checked="currentStorageItem.children.length ===
                                selectStorageItemList.length
                                " @click="selectAllStorageItem()" />
                        </th>
                        <th class="name-header">名称</th>
                        <th class="size-header">大小</th>
                        <th class="date-header">修改时间</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in currentStorageItem.children" :key="item.name" class="file-row" @click="
                        $router.push(getFullPath(route.path, item.name))
                        ">
                        <td class="checkbox-cell">
                            <input type="checkbox" :checked="selectStorageItemList.includes(item.name)
                                " @click.stop="selectStorageItem(item.name)" />
                        </td>
                        <td class="name-cell">
                            <div class="name-wrapper">
                                <span class="file-icon" v-if="item.type === 'file'">
                                    <AiOutlineFile />
                                </span>
                                <span class="folder-icon" v-if="item.type === 'folder'">
                                    <AiOutlineFolder />
                                </span>
                                <span class="item-link">
                                    {{ item.name }}
                                </span>
                            </div>
                        </td>
                        <td class="size-cell">{{ formatSize(item.size) }}</td>
                        <td class="date-cell">{{ item.created }}</td>
                    </tr>
                </tbody>
            </table>
        </main>

        <!-- 功能界面 -->
        <div v-show="functionActive !== null" class="modal-mask" @click.self="activeFunction(null)">
            <!-- 关闭按钮 -->
            <button @click.stop="activeFunction(null)" class="close-btn">
                <AiOutlineClose class="close-icon" />
            </button>

            <!-- 功能组件 -->
            <component :is="downloadComp" v-show="functionActive === 'download'" :selectedItems="selectStorageItemList"
                :activeFunction="activeFunction" />
            <component :is="moveComp" v-show="functionActive === 'move'" :selectedItems="selectStorageItemList"
                :activeFunction="activeFunction" />
            <component :is="deleteComp" v-show="functionActive === 'delete'" :selectedItems="selectStorageItemList"
                :activeFunction="activeFunction" />
            <component :is="settingComp" v-show="functionActive === 'setting'"
                :updateCurrentStorageItem="updateCurrentStorageItem" />
            <component :is="uploadComp" v-show="functionActive === 'upload'" />
        </div>
    </div>
</template>

<style scoped>
.container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #1a202c;
    color: #e5e7eb;
}

.app-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background-color: #2d3748;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 新增面包屑样式 */
.breadcrumb {
    display: flex;
    align-items: center;
    gap: 0.2rem;
}

.crumb-link {
    color: #a0aec0;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s;
    position: relative;

    &:not(.last-crumb):hover {
        color: #63b3ed;
    }

    &.last-crumb {
        color: #e5e7eb;
        cursor: default;
    }
}

.separator {
    color: #4a5568;
    user-select: none;
}

.path-display {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.logo {
    height: 2rem;
    width: 2rem;
    border-radius: 50%;
}

.path-text {
    color: #a0aec0;
    font-size: 0.9rem;
}

/* 右侧组合布局 */
.right-group {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-left: auto;
}

/* 操作按钮组 */
.storage-actions {
    display: flex;
    gap: 1rem;
    position: relative;
}

/* 单个操作项 */
.action-item {
    position: relative;
    background: none;
    border: none;
    color: #a0aec0;
    cursor: pointer;
    padding: 0;
    transition: all 0.2s ease;

    &:hover {
        color: #63b3ed;

        .tooltip {
            opacity: 1;
            transform: translateX(-50%) translateY(5px);
        }
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;

        &:hover {
            color: #a0aec0;

            .tooltip {
                display: none;
            }
        }
    }

    .tooltip {
        position: absolute;
        top: 80%;
        /* 修改为下方定位 */
        left: 50%;
        transform: translateX(-50%) translateY(-5px);
        background: #2d3748;
        color: #e5e7eb;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 0.85rem;
        white-space: nowrap;
        opacity: 0;
        pointer-events: none;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        z-index: 10;
        margin-top: 8px;

        &::after {
            content: "";
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-bottom-color: #2d3748;
        }
    }
}

.search-box {
    margin-right: 50px;
    width: 200px;
}

.search-input {
    width: 100%;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid #4a5568;
    background-color: #2d3748;
    color: inherit;
    transition: border-color 0.2s;

    &:focus {
        border-color: #63b3ed;
        outline: none;
    }
}

.modal-mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: grid;
    place-items: center;
    z-index: 1000;
    backdrop-filter: blur(2px);
}

.userPanel {
    background: #2d3748;
    border-radius: 10px;
    /* min-width: 1000px; */
    width: 80%;
    height: 80%;
    padding: 0;
    max-height: 80%;
    overflow-y: auto;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    position: relative;
    max-width: 1000px;
}

.close-btn {
    margin: 0;
    padding: 0;
    position: fixed;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: #4a5568;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: all 0.2s ease;
    z-index: 10;
}

.close-btn:hover {
    background: #718096;
    transform: rotate(90deg);
}

.close-icon {
    color: #e5e7eb;
}

.content-area {
    flex: 1;
    padding: 2rem;
    overflow-y: auto;
    max-width: 1000px;
    /* 设置最大宽度 */
    width: 80%;
    /* 确保宽度自适应 */
    margin: 0 auto;
    /* 水平居中 */
}

.file-view {
    padding: 2rem;
    background: #2d3748;
    border-radius: 8px;
    margin: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.file-meta {
    display: grid;
    gap: 0.8rem;
}

.file-meta h2 {
    color: #63b3ed;
    font-size: 1.5rem;
}

.download-btn {
    align-self: start;
    padding: 0.8rem 1.5rem;
    background: #4299e1;
    color: white;
    border-radius: 6px;
    border: 0px;
    text-decoration: none;
    transition: background 0.2s;

    &:hover {
        background: #3182ce;
    }
}

.error-state {
    padding: 2rem;
    text-align: center;
    color: #fc8181;
}

.file-table {
    width: 100%;
    border-collapse: collapse;
    background-color: #2d3748;
    border-radius: 8px;
    overflow: hidden;
    border: 10px;
}

.file-table th,
.file-table td {
    padding: 1rem;
    text-align: left;
}

.file-table thead {
    background-color: #4a5568;
}

.file-row {
    border-bottom: 1px solid #4a5568;

    &:last-child {
        border-bottom: none;
    }

    transition: background-color 0.2s;

    &:hover {
        background-color: #3c4656;
    }
}

.checkbox-cell {
    width: 40px;
    text-align: center;
}

.name-wrapper {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

.file-icon,
.folder-icon {
    display: inline-flex;
    font-size: 1.1em;
    margin-top: -1px;
}

.item-link {
    color: #63b3ed;
    text-decoration: none;
    transition: color 0.2s;
    cursor: default;
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #a0aec0;
}
</style>
