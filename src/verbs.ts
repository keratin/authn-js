export function get(url: string, queryString: string): Promise<any> {
  return jhr((xhr: XMLHttpRequest) => {
    xhr.open("GET", `${url}?${queryString}`);
    xhr.send();
  });
}

export function post(url: string, formData: string): Promise<any> {
  return jhr((xhr: XMLHttpRequest) => {
    xhr.open("POST", url);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(formData);
  });
}

function jhr(sender: (xhr: XMLHttpRequest)=>void): Promise<any> {
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
