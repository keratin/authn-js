import {FormData} from "./types";

// takes a simple map, returns a string
export function formData(data: FormData): string {
  return Object.keys(data)
    .map((k) => formDataItem(k, data[k]))
    .filter((str) => str !== undefined)
    .join('&');
}

function formDataItem(k: string, v: string | undefined): string | undefined {
  if (typeof v !== "undefined") {
    return `${k}=${encodeURIComponent(v)}`;
  }
}
