import { StringMap } from "./types";
import { KeratinError } from "./types";
import formData from "./formData";

export function get<T>(url: string, data: StringMap): Promise<T> {
  return jhr((xhr: XMLHttpRequest) => {
    xhr.open("GET", `${url}?${formData(data)}`.replace(/\?$/, ''));
    xhr.send();
  });
}

export function del<T>(url: string): Promise<T> {
  return jhr((xhr: XMLHttpRequest) => {
    xhr.open("DELETE", url);
    xhr.send();
  });
}

export function post<T>(url: string, data: StringMap): Promise<T> {
  return jhr((xhr: XMLHttpRequest) => {
    xhr.open("POST", url);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(formData(data));
  });
}

function jhr<T>(sender: (xhr: XMLHttpRequest) => void): Promise<T> {
  return new Promise((
    fulfill: (data: T) => any,
    reject: (errors: KeratinError[]) => any
  ) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true; // enable authentication server cookies
    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.DONE) {
        const data: {result: T} | {errors: KeratinError[]} = (xhr.responseText.length > 1) ? JSON.parse(xhr.responseText) : {};

        if ('errors' in data) {
          reject(data.errors)
        } else if (xhr.status > 400) {
          // statusText may be missing in HTTP/2. only the status number is reliable.
          reject([{message: xhr.status.toString()}])
        } else {
          fulfill(data.result)
        }
      }
    };
    sender(xhr);
  });
}
