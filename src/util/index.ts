function getFullPath(base: string, path: string) {
    return `/${base}/${path}`.replace(/\/+/g, '/');
}

function uuid() {
    var uuidValue = "", k, randomValue;
    for (k = 0; k < 32; k++) {
        randomValue = Math.random() * 16 | 0;
        if (k == 8 || k == 12 || k == 16 || k == 20) {
            uuidValue += "-"
        }
        uuidValue += (k == 12 ? 4 : (k == 16 ? (randomValue & 3 | 8) : randomValue)).toString(16);
    }
    return uuidValue;
}

function downloadFile(url: string, filename: string) {
    // fetch(url).then((res) => {
    //     res.blob().then((blob) => {
    //         const blobUrl = window.URL.createObjectURL(blob);
    //         // 这里的文件名根据实际情况从响应头或者url里获取
    //         const a = document.createElement('a');
    //         a.href = blobUrl;
    //         a.download = filename;
    //         a.click();
    //         window.URL.revokeObjectURL(blobUrl);
    //     });
    // });
    window.open(`${url}?filename=${filename}`)
}

const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
};

function now() {
    const now = new Date();

    const year = now.getFullYear();
    const month = ('0' + (now.getMonth() + 1)).slice(-2);
    const day = ('0' + now.getDate()).slice(-2);
    const hours = ('0' + now.getHours()).slice(-2);
    const minutes = ('0' + now.getMinutes()).slice(-2);
    const seconds = ('0' + now.getSeconds()).slice(-2);

    const formattedTime = `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
    return formattedTime;
}

export {
    uuid,
    downloadFile,
    getFullPath,
    formatSize,
    now,
}