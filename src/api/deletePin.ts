import { axiosAuth } from "@/util/axios";
import { notyf } from "@/util/notify";
import { useSettingStore } from "@/util/pinia";


async function deletePin(requestId: string) {
    const settingStore = useSettingStore();
    try {
        const res = axiosAuth.delete(`${settingStore.server.pin.use}/psa/pins/${requestId}`);
    } catch {
        notyf.error('删除失败')
    }
}

export {
    deletePin,
}