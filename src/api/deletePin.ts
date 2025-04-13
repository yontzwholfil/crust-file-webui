import { useSettingStore } from "@/store/setting";
import { axiosAuth } from "@/util/axios";
import { notyf } from "@/util/notify";


async function deletePin(requestId: string) {
  const settingStore = useSettingStore();
  try {
    const res = axiosAuth.delete(`https://${settingStore.setting.server.pin.use}/psa/pins/${requestId}`);
  } catch {
    notyf.error('删除失败')
  }
}

export {
  deletePin,
}
