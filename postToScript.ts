import { API_ROUTING, DEFAULT_API_URL } from './config';

export const postToScript = async (
  payload: any,
  idnumber?: string
) => {
  const targetUrl =
    (idnumber && API_ROUTING[idnumber]) || DEFAULT_API_URL;

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("❌ Lỗi gửi Google Script:", e);
    throw e;
  }
};
