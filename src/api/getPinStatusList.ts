import type { PinListResponse } from "@/type/crust";
import { axiosAuth } from "@/util/axios";

async function getStorageInfo() {
  try {
    const storageInfo: PinListResponse = await axiosAuth.get('https://pin.crustcode.com/psa/pins?limit=100');
    return storageInfo;
  } catch {
    console.log("getStoreageInfo error");
    return null;
  }
}

export { getStorageInfo };
