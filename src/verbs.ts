import { formData, FormData } from "./form_data";

export function get<T>(url: string, data: FormData): Promise<T> {
  return jhr((xhr: XMLHttpRequest) => {
    xhr.open("GET", `${url}?${formData(data)}`.replace(/\?$/, ''));
    xhr.send();
  });
}

export function post<T>(url: string, data: FormData): Promise<T> {
  return jhr((xhr: XMLHttpRequest) => {
    xhr.open("POST", url);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(formData(data));
  });
}

function jhr<T>(sender: (xhr: XMLHttpRequest) => void): Promise<T> {
  return new Promise((fulfill, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true; // enable authentication server cookies
    xhr.onreadystatechange = () => {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        const data = (xhr.responseText.length > 1) ? JSON.parse(xhr.responseText) : {};
        if (data.result) {
          fulfill(data.result);
        } else if (data.errors) {
          reject(data.errors);
        } else {
          reject(xhr.statusText);
        }
      }
    };
    sender(xhr);
  });
}
