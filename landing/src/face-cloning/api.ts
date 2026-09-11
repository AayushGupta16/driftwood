import { activeMockMode } from '../mock-mode.ts';
export const API = '/api/v1/dashboard/face-cloning';
export async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: 'include', ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.detail || `Something went wrong (${response.status}). Please try again.`);
  }
  return response.json() as Promise<T>;
}
export function post<T>(path: string, body: unknown): Promise<T> {
  return json<T>(path, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body)});
}
export function uploadFile(url: string, file: File, contentType: string, progress: (percent: number) => void): Promise<void> {
  if (activeMockMode()) {
    progress(0);
    return json(url, {method: 'PUT', body: file}).then(() => { progress(100); });
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.timeout = 10 * 60 * 1000;
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error('Upload failed. Please try again.'));
    xhr.onerror = () => reject(new Error('The upload lost its connection. Please try again.'));
    xhr.ontimeout = () => reject(new Error('Upload timed out. Please try again on a faster connection.'));
    xhr.send(file);
  });
}
