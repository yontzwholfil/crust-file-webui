type StorageItem = {
    type: "file" | "folder",
    name: string,
    size: number,
    created: string,
    cid?: string,
    request_id?: string,
    children?: StorageItem[],
};

type FileItem = StorageItem & {
    type: 'file',
    cid: string,
    request_id: string,
};

type FolderItem = StorageItem & {
    type: 'folder',
    children: StorageItem[],
};

export type {
    StorageItem,
    FileItem,
    FolderItem,
}