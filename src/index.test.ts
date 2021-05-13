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
      rest.post("https://authn.example.com/accounts", (_, res, ctx) =>
        res(ctx.json({ result: { id_token: idToken({ age: 1 }) } }))
      )
    );
    await AuthN.signup({ username: "test", password: "test" });

    const token = AuthN.session();
    expect(token!.length).toBeGreaterThan(0);
    expect(token!.split(".")).toHaveLength(3);
    expect(readCookie("authn")).toEqual(token);
  });
});
