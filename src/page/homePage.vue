<script lang="ts" setup>
import { useRoute } from 'vue-router';
import { ref, watch, computed } from 'vue';
import { useSettingStore } from '@/util/pinia';
import type { FileItem, FolderItem, StorageItem } from '@/type/storage';
import { AiOutlineClose, AiOutlineCloudDownload, AiOutlineCloudUpload, AiOutlineDelete, AiOutlineFile, AiOutlineFolder, AiOutlineSetting } from 'vue-icons-plus/ai';
import { BiMove } from 'vue-icons-plus/bi';
import deleteComp from '@/component/deleteComp.vue';
import downloadComp from '@/component/downloadComp.vue';
import moveComp from '@/component/moveComp.vue';
import settingComp from '@/component/settingComp.vue';
import uploadComp from '@/component/uploadComp.vue';
import { downloadFile, formatSize, getFullPath } from '@/util';

const route = useRoute();
const settingStore = ref(useSettingStore());

// 响应式数据
const selectedItems = ref<string[]>([]);
const currentPath = ref(route.path);
const currentContent = ref<{ type: 'file' | 'folder' | 'error'; content: StorageItem | StorageItem[] }>({
    type: 'folder',
    content: []
});

// 计算属性
const allSelected = computed({
    get: () => selectedItems.value.length === (currentContent.value.content as StorageItem[]).length
        && (currentContent.value.content as StorageItem[]).length > 0,
    set: (value) => {
        selectedItems.value = value
            ? (currentContent.value.content as StorageItem[]).map(item => item.name)
            : [];
    }
});

// 监听路径变化
watch(() => route.path, (newPath) => {
    currentPath.value = newPath;
    updateContent();
    updateTitle();
});

// 方法
const updateTitle = () => {
    const titleSegment = currentPath.value.split('/').filter(Boolean).pop() || 'home';
    document.title = `${titleSegment} | Crust`;
};

const updateContent = () => {
    try {
        const result = settingStore.value.getContentItem(currentPath.value);

        if (result === undefined) {
            currentContent.value = { type: 'error', content: [] };
            return
        } else if (result.type === 'file') {
            currentContent.value.type = 'file';
            currentContent.value.content = result;
        } else if (result.type === 'folder') {
            currentContent.value.type = 'folder';
            currentContent.value.content = (result as FolderItem).children;
        }
    } catch (error) {
        // console.error('路径解析错误:', error);
        currentContent.value = { type: 'error', content: [] };
    }

};

const toggleSelection = (itemName: string) => {
    selectedItems.value = selectedItems.value.includes(itemName)
        ? selectedItems.value.filter(name => name !== itemName)
        : [...selectedItems.value, itemName];
};


// 生成面包屑导航数据
const breadcrumbs = computed(() => {
    const segments = currentPath.value.split('/').filter(Boolean);
    const crumbs = [{ name: 'Home', path: '/' }];

    let accumulatedPath = '';
    for (const segment of segments) {
        accumulatedPath += `/${segment}`;
        crumbs.push({
            name: segment,
            path: accumulatedPath
        });
    }
    return crumbs;
});

const hasSelection = computed(() => selectedItems.value.length > 0);

// 设置面板的显示
const activePanel = ref<string | null>(null)
const openPanel = (panel: string) => {
    activePanel.value = panel
}
const closePanel = () => {
    selectedItems.value = [];
    activePanel.value = null
}

// 初始化
updateTitle();
updateContent();

</script>

<template>
    <div class="container">
        <!-- 顶部导航栏 -->
        <header class="app-bar">
            <div class="path-display">
                <router-link to="/">
                    <img src="/src/public/favicon.ico" class="logo" alt="Logo">
                </router-link>
                <nav class="breadcrumb">
                    <template v-for="(crumb, index) in breadcrumbs" :key="crumb.path">
                        <router-link :to="crumb.path" class="crumb-link"
                            :class="{ 'last-crumb': index === breadcrumbs.length - 1 }">
                            {{ crumb.name }}
                        </router-link>
                        <span v-if="index < breadcrumbs.length - 1" class="separator">/</span>
                    </template>
                </nav>
            </div>
            <div class="right-group">
                <div class="storage-actions">
                    <button class="action-item" @click="openPanel('download')" :disabled="!hasSelection"
                        aria-label="下载选中项目">
                        <AiOutlineCloudDownload />
                        <span class="tooltip">下载</span>
                    </button>

                    <button class="action-item" @click="openPanel('move')" :disabled="!hasSelection"
                        aria-label="移动选中项目">
                        <BiMove />
                        <span class="tooltip">移动</span>
                    </button>

                    <button class="action-item" @click="openPanel('delete')" :disabled="!hasSelection"
                        aria-label="删除选中项目">
                        <AiOutlineDelete />
                        <span class="tooltip">删除</span>
                    </button>

                    <button class="action-item" @click="openPanel('upload')" aria-label="上传文件"
                        v-show="currentContent.type !== 'file'">
                        <AiOutlineCloudUpload />
                        <span class="tooltip">上传</span>
                    </button>

                    <button class="action-item" @click="openPanel('setting')" aria-label="设置">
                        <AiOutlineSetting />
                        <span class="tooltip">设置</span>
                    </button>
                </div>

                <div class="search-box">
                    <input type="text" placeholder="搜索文件..." class="search-input">
                </div>
            </div>
        </header>

        <!-- 功能界面 -->
        <div v-show="activePanel !== null" class="modal-mask" @click.self="closePanel">
            <div class="userPanel">
                <!-- 关闭按钮 -->
                <button @click="closePanel" class="close-btn">
                    <AiOutlineClose class="close-icon" />
                </button>

                <!-- 功能组件 -->
                <component :is="downloadComp" v-show="activePanel === 'download'" :selectedItems="selectedItems"
                    :closePanel="closePanel" />
                <component :is="moveComp" v-show="activePanel === 'move'" :selectedItems="selectedItems"
                    :closePanel="closePanel" />
                <component :is="deleteComp" v-show="activePanel === 'delete'" :selectedItems="selectedItems"
                    :closePanel="closePanel" />
                <component :is="settingComp" v-show="activePanel === 'setting'" :updateContent="updateContent" />
                <component :is="uploadComp" v-show="activePanel === 'upload'" />
            </div>
        </div>

        <!-- 错误状态 -->
        <div v-if="currentContent.type === 'error'" class="error-state">
            <p>路径不存在或包含非法文件类型</p>
        </div>

        <!-- 文件内容展示区 -->
        <main class="content-area">
            <!-- 文件视图 -->
            <section v-if="currentContent.type === 'file'" class="file-view">
                <div class="file-meta">
                    <h2>{{ (currentContent.content as FileItem).name }}</h2>
                    <p>文件大小：{{ formatSize((currentContent.content as FileItem).size) }}</p>
                    <p>创建时间：{{ (currentContent.content as FileItem).created }}</p>
                </div>
                <button class="download-btn"
                    @click="downloadFile(`${settingStore.server.download.use}/ipfs/${(currentContent.content as FileItem).cid}`, (currentContent.content as FileItem).name)">
                    下载文件
                </button>
            </section>

            <!-- 文件夹视图 -->
            <table v-else-if="currentContent.type === 'folder'" class="file-table">
                <thead>
                    <tr>
                        <th class="checkbox-cell">
                            <input type="checkbox" v-model="allSelected">
                        </th>
                        <th class="name-header">名称</th>
                        <th class="size-header">大小</th>
                        <th class="date-header">修改时间</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in (currentContent.content as StorageItem[])" :key="item.name" class="file-row">
                        <td class="checkbox-cell">
                            <input type="checkbox" :checked="selectedItems.includes(item.name)"
                                @change="toggleSelection(item.name)">
                        </td>
                        <td class="name-cell">
                            <div class="name-wrapper">
                                <span class="file-icon" v-if="item.type === 'file'">
                                    <AiOutlineFile />
                                </span>
                                <span class="folder-icon" v-if="item.type === 'folder'">
                                    <AiOutlineFolder />
                                </span>
                                <router-link class="item-link" :to="getFullPath(route.fullPath, item.name)">
                                    {{ item.name }}
                                </router-link>
                            </div>
                        </td>
                        <td class="size-cell">{{ formatSize(item.size) }}</td>
                        <td class="date-cell">{{ item.created }}</td>
                    </tr>
                </tbody>
            </table>
        </main>
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
            content: '';
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

    &:hover {
        color: #4299e1;
        text-decoration: underline;
    }
}

.empty-state {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #a0aec0;
}
</style>