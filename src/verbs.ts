import {StringMap} from "./types";
import {KeratinError} from "./types";
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
    fulfill: (data?: T) => any,
    reject: (errors: KeratinError[]) => any
  ) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true; // enable authentication server cookies
    xhr.onreadystatechange = () => {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        const data = maybeParseJSON<T>(xhr.responseText);

        if (data.result) {
          fulfill(data.result);
        } else if (data.errors) {
          reject(data.errors);
        } else if (xhr.status >= 200 && xhr.status < 400) {
          fulfill()
        } else {
          reject([{
            // http://stackoverflow.com/questions/872206/http-status-code-0-what-does-this-mean-in-ms-xmlhttp#14507670
            message: xhr.statusText === '' ? 'connection failed' : xhr.statusText
          }]);
        }
      }
    };
    sender(xhr);
  });
}

function maybeParseJSON<T>(response: string): { result?: T, errors?: KeratinError[] } {
  if (response === '') {
    return {}
  }
  try {
    return JSON.parse(response)
  } catch (err) {
    return {errors: [{message: `HTTP response '${response}' is not JSON as expected: ${err}`}]}
  }
}
