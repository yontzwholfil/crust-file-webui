<script lang="ts" setup>
import { computed } from 'vue';
import type { FileItem } from '@/type/storage';
import { downloadFile, getFullPath } from '@/util';
import { useSettingStore } from '@/util/pinia';
import { AiOutlineDownload, AiOutlineClose } from 'vue-icons-plus/ai';

const settingStore = useSettingStore();
const props = defineProps<{
    selectedItems: string[];
    closePanel: () => void;
}>();

// 获取选中文件的完整路径和文件信息
const selectedFiles = computed(() => {
    return props.selectedItems.map(filename => {
        const basePath = window.location.pathname;
        const fullPath = getFullPath(basePath, filename);
        const item = settingStore.getContentItem(fullPath);
        return {
            filename,
            fullPath,
            item,
            isFile: item?.type === 'file'
        };
    });
});

// 检查是否包含文件夹
const containsFolders = computed(() =>
    selectedFiles.value.some(file => !file.isFile)
);

// 下载文件
const downloadSelected = () => {
    selectedFiles.value.forEach(file => {
        if (file.isFile && file.item) {
            const fileItem = file.item as FileItem;
            // 调用您的下载函数，这里假设 downloadFile 已全局可用
            downloadFile(`${settingStore.server.download.use}/ipfs/${fileItem.cid}`, fileItem.name);
        }
    });
    props.closePanel();
};
</script>

<template>
    <div class="download-confirm-container">
        <div class="confirm-header">
            <h3>下载确认</h3>
            <button class="close-btn" @click="closePanel">
                <AiOutlineClose />
            </button>
        </div>

        <div class="confirm-content">
            <p>将要下载以下 {{selectedFiles.filter(f => f.isFile).length}} 个文件：</p>

            <ul class="file-list">
                <li v-for="file in selectedFiles" :key="file.fullPath" class="file-item">
                    <span class="filename">{{ file.filename }}</span>
                    <span v-if="!file.isFile" class="folder-tag">(文件夹，不会下载)</span>
                </li>
            </ul>

            <p v-if="containsFolders" class="warning-message">
                <strong>注意：</strong>您选择的项目中包含文件夹，文件夹内容不会被下载
            </p>
        </div>

        <div class="confirm-actions">
            <button class="cancel-btn" @click="closePanel">取消</button>
            <button class="confirm-btn" @click="downloadSelected">
                <AiOutlineDownload />
                <span>确认下载</span>
            </button>
        </div>
    </div>
</template>

<style scoped>
.download-confirm-container {
    background: #2d3748;
    border-radius: 8px;
    padding: 20px;
    color: #e5e7eb;
    font-family: 'Segoe UI', system-ui, sans-serif;
}

.confirm-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.confirm-header h3 {
    margin: 0;
    font-size: 18px;
    color: #e5e7eb;
}

.close-btn {
    background: transparent;
    border: none;
    color: #a0aec0;
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
}

.close-btn:hover {
    color: #e5e7eb;
    background: rgba(160, 174, 192, 0.1);
}

.confirm-content {
    margin-bottom: 20px;
}

.confirm-content p {
    margin: 0 0 12px;
    color: #a0aec0;
    font-size: 14px;
}

.file-list {
    list-style: none;
    padding: 0;
    margin: 0 0 16px;
    max-height: 200px;
    overflow-y: auto;
}

.file-item {
    padding: 8px 12px;
    margin-bottom: 6px;
    background: rgba(160, 174, 192, 0.08);
    border-radius: 4px;
    font-size: 14px;
}

.filename {
    color: #e5e7eb;
}

.folder-tag {
    color: #f6ad55;
    font-size: 12px;
    margin-left: 8px;
}

.warning-message {
    padding: 8px 12px;
    background: rgba(246, 173, 85, 0.1);
    border-left: 3px solid #f6ad55;
    color: #f6ad55;
    font-size: 13px;
    margin: 12px 0 0;
}

.confirm-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 16px;
    border-top: 1px solid #4a5568;
}

.confirm-actions button {
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
}

.cancel-btn {
    background: #4a5568;

    border: none;
    color: #e5e7eb;
}

.cancel-btn:hover {
    background: #5a677d;
}

.confirm-btn {
    background: #4299e1;
    border: none;
    color: white;
}

.confirm-btn:hover {
    background: #3182ce;
}
</style>