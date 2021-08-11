import { rest } from "msw";
import { setupServer } from "msw/node";
import * as AuthN from "./index";

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

AuthN.setHost("https://authn.example.com");
AuthN.setCookieStore("authn");

function jwt(payload: Record<string, string | number>): string {
  var metadata = {};
  var signature = "BEEF";
  return (
    btoa(JSON.stringify(metadata)) +
    "." +
    btoa(JSON.stringify(payload)) +
    "." +
    btoa(signature)
  );
}

function idToken(options: { age: number }): string {
  var age = options.age || 600;
  var iat = Math.floor(Date.now() / 1000) - age;
  return jwt({
    sub: 1,
    iat: iat,
    exp: iat + 3600,
  });
}

const errorsObj = (data: Record<string, string>) =>
  Object.keys(data).map(function (k) {
    return { field: k, message: data[k] };
  });

type RestResolver = ReturnType<typeof rest.post>["resolver"];
const jsonResolver =
  (data: Record<string, any>): RestResolver =>
  (_, res, ctx) =>
    res(ctx.json(data));
const resultResolver = (data: any) => jsonResolver({ result: data });
const errorsResolver = (data: Record<string, string>) =>
  jsonResolver({ errors: errorsObj(data) });

function readCookie(name: string): string {
  return document.cookie.replace(
    new RegExp("(?:(?:^|.*;\\s*)" + name + "\\s*\\=\\s*([^;]*).*$)|^.*$"),
    "$1"
  );
}

function writeCookie(name: string, val: string): void {
  document.cookie = name + "=" + val + ";";
}

function deleteCookie(name: string): void {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

describe("signup", () => {
  test("success", async () => {
    server.use(
      rest.post(
        "https://authn.example.com/accounts",
        resultResolver({ id_token: idToken({ age: 1 }) })
      )
    );
    await AuthN.signup({ username: "test", password: "test" });

    const token = AuthN.session();
    expect(token!.length).toBeGreaterThan(0);
    expect(token!.split(".")).toHaveLength(3);
    expect(readCookie("authn")).toEqual(token);
  });

  test("failure", async () => {
    server.use(
      rest.post(
        "https://authn.example.com/accounts",
        errorsResolver({ foo: "bar" })
      )
    );

    await expect(
      AuthN.signup({ username: "test", password: "test" })
    ).rejects.toEqual([{ field: "foo", message: "bar" }]);
  });

  test("double submit", async () => {
    server.use(
      rest.post(
        "https://authn.example.com/accounts",
        resultResolver({ id_token: idToken({ age: 1 }) })
      )
    );

    const race = Promise.all([
      AuthN.signup({ username: "test", password: "test" }),
      AuthN.signup({ username: "test", password: "test" }),
    ]);

    await expect(race).rejects.toEqual([{ message: "duplicate" }]);
  });
});

describe("isAvailable", () => {
  test("name is not taken", async () => {
    server.use(
      rest.get(
        "https://authn.example.com/accounts/available",
        (req, res, ctx) => {
          expect(req.url.searchParams.get("username")).toBe("test");
          return res(ctx.json({ result: true }));
        }
      )
    );

    expect(await AuthN.isAvailable("test")).toBeTruthy();
  });

  test("name is taken", async () => {
    server.use(
      rest.get(
        "https://authn.example.com/accounts/available",
        (req, res, ctx) => {
          expect(req.url.searchParams.get("username")).toBe("test");
          return res(
            ctx.json({ errors: [{ field: "username", message: "TAKEN" }] })
          );
        }
      )
    );

    expect(await AuthN.isAvailable("test")).toBeFalsy();
  });
});

describe("restoreSession", () => {
  test("no existing session", async () => {
    deleteCookie("authn");

    await expect(AuthN.restoreSession()).rejects.toEqual("No session.");
    expect(AuthN.session()).toBeFalsy();
  });

  test("existing session", async () => {
    writeCookie("authn", idToken({ age: 1 }));

    await AuthN.restoreSession();
    expect(AuthN.session()).toBeTruthy();
  });

  test("aging session", async () => {
    var oldSession = idToken({ age: 3000 });
    var newSession = idToken({ age: 1 });

    writeCookie("authn", oldSession);
    server.use(
      rest.get(
        "https://authn.example.com/session/refresh",
        resultResolver({ id_token: newSession })
      )
    );

    await AuthN.restoreSession();
    expect(AuthN.session()).toBe(newSession);
  });

  test("aging and revoked session", async () => {
    writeCookie("authn", idToken({ age: 3000 }));
    server.use(
      rest.get("https://authn.example.com/session/refresh", (_, res, ctx) =>
        res(ctx.status(401, ""))
      )
    );

    await expect(AuthN.restoreSession()).rejects.toEqual([{ message: "401" }]);
    expect(AuthN.session()).toBeFalsy();
  });

  test("expired session", async () => {
    var oldSession = idToken({ age: 9999 });
    var newSession = idToken({ age: 1 });

    writeCookie("authn", oldSession);
    server.use(
      rest.get(
        "https://authn.example.com/session/refresh",
        resultResolver({ id_token: newSession })
      )
    );

    await AuthN.restoreSession();
    expect(AuthN.session()).toBe(newSession);
  });

  test("expired and revoked session", async () => {
    writeCookie("authn", idToken({ age: 9999 }));
    server.use(
      rest.get("https://authn.example.com/session/refresh", (_, res, ctx) =>
        res(ctx.status(401, ""))
      )
    );

    await expect(AuthN.restoreSession()).rejects.toEqual([{ message: "401" }]);
    expect(AuthN.session()).toBeFalsy();
  });

  test("malformed JWT", async () => {
    writeCookie("authn", "invalid");

    await expect(AuthN.restoreSession()).rejects.toEqual(
      "Malformed JWT: invalid encoding"
    );
  });
});

describe("importSession", () => {
  test("no existing session", async () => {
    deleteCookie("authn");
    var newSession = idToken({ age: 1 });

    server.use(
      rest.get(
        "https://authn.example.com/session/refresh",
        resultResolver({ id_token: newSession })
      )
    );

    await AuthN.importSession();
    expect(AuthN.session()).toBe(newSession);
  });
});

describe("login", () => {
  test("success", async () => {
    server.use(
      rest.post(
        "https://authn.example.com/session",
        resultResolver({ id_token: idToken({ age: 1 }) })
      )
    );

    await AuthN.login({ username: "test", password: "test" });

    const token = AuthN.session();
    expect(token!.length).toBeGreaterThan(0);
    expect(token!.split(".")).toHaveLength(3);
    expect(readCookie("authn")).toEqual(token);
  });

  test("failure", async () => {
    server.use(
      rest.post(
        "https://authn.example.com/session",
        errorsResolver({ foo: "bar" })
      )
    );

    await expect(
      AuthN.login({ username: "test", password: "test" })
    ).rejects.toEqual([{ field: "foo", message: "bar" }]);
  });
});

describe("requestPasswordReset", () => {
  test("success or failure", async () => {
    server.use(
      rest.get("https://authn.example.com/password/reset", (req, res, ctx) => {
        expect(req.url.searchParams.get("username")).toBe("test");
        return res(ctx.text(""));
      })
    );

    expect(await AuthN.requestPasswordReset("test")).toBeUndefined();
  });
});

describe("changePassword", () => {
  test("success", async () => {
    server.use(
      rest.post(
        "https://authn.example.com/password",
        resultResolver({ id_token: idToken({ age: 1 }) })
      )
    );

    await AuthN.changePassword({
      password: "new",
      currentPassword: "old",
    });

    const token = AuthN.session();
    expect(token!.length).toBeGreaterThan(0);
    expect(token!.split(".")).toHaveLength(3);
    expect(readCookie("authn")).toEqual(token);
  });

  test("failure", async () => {
    server.use(
      rest.post(
        "https://authn.example.com/password",
        errorsResolver({ foo: "bar" })
      )
    );

    await expect(
      AuthN.changePassword({
        password: "new",
        currentPassword: "wrong",
      })
    ).rejects.toEqual([{ field: "foo", message: "bar" }]);
  });
});

describe("resetPassword", () => {
  test("success", async () => {
    server.use(
      rest.post(
        "https://authn.example.com/password",
        resultResolver({ id_token: idToken({ age: 1 }) })
      )
    );

    await AuthN.resetPassword({
      password: "new",
      token: jwt({ foo: "bar" }),
    });

    const token = AuthN.session();
    expect(token!.length).toBeGreaterThan(0);
    expect(token!.split(".")).toHaveLength(3);
    expect(readCookie("authn")).toEqual(token);
  });

  test("failure", async () => {
    server.use(
      rest.post(
        "https://authn.example.com/password",
        errorsResolver({ foo: "bar" })
      )
    );

    await expect(
      AuthN.resetPassword({
        password: "new",
        token: jwt({ foo: "bar" }),
      })
    ).rejects.toEqual([{ field: "foo", message: "bar" }]);
  });
});

describe("logout", () => {
  test("success", async () => {
    writeCookie("authn", idToken({ age: 1 }));
    server.use(
      rest.delete("https://authn.example.com/session", (_, res, ctx) =>
        res(ctx.text(""))
      )
    );

    await AuthN.restoreSession();
    expect(AuthN.session()).toBeTruthy();

    await AuthN.logout();
    expect(AuthN.session()).toBeFalsy();
  });
});

describe("requestSessionToken", () => {
  test("success or failure", async () => {
    server.use(
      rest.get("https://authn.example.com/session/token", (req, res, ctx) => {
        expect(req.url.searchParams.get("username")).toBe("test");
        return res(ctx.text(""));
      })
    );

    expect(await AuthN.requestSessionToken("test")).toBeUndefined();
  });
});

describe("sessionTokenLogin", () => {
  test("success", async () => {
    server.use(
      rest.post(
        "https://authn.example.com/session/token",
        resultResolver({ id_token: idToken({ age: 1 }) })
      )
    );

    await AuthN.sessionTokenLogin({ token: "test" });

    const token = AuthN.session();
    expect(token!.length).toBeGreaterThan(0);
    expect(token!.split(".")).toHaveLength(3);
    expect(readCookie("authn")).toEqual(token);
  });

  test("failure", async () => {
    server.use(
      rest.post(
        "https://authn.example.com/session/token",
        errorsResolver({ foo: "bar" })
      )
    );

    await expect(
      AuthN.sessionTokenLogin({
        token: jwt({ foo: "bar" }),
      })
    ).rejects.toEqual([{ field: "foo", message: "bar" }]);
  });
});
