export interface FormData {
  [index: string]: string;
}

// takes a simple map, returns a string
export function formData(data: FormData): string {
  return Object.keys(data)
    .map((k) => formDataItem(k, data[k]))
    .join('&');
}

function formDataItem(k: string, v: string): string {
  return `${k}=${encodeURIComponent(v)}`;
}
