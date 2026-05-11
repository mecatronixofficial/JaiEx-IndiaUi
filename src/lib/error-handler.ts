import { showToast } from "./toast";

export function handleApiError(error: any) {
  const message = error?.response?.data?.message || "Something went wrong";

  showToast.error(message);
}
