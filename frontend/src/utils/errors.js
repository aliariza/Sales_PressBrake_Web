export function getErrorMessage(error, fallback = "Bir hata oluştu") {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (error?.code === "ERR_NETWORK") {
    return "API'ye şu anda ulaşılamıyor. Backend servisinin çalıştığını kontrol edin.";
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
}
