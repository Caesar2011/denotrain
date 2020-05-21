# Cookies

There are two ways to store cookies. There is the possibility to add cookies directly to the HTTP response. Another possibility is to use the `CookieStorage` provided by Denotrain. The second way is recommended.

## Using CookieStorage (recommended)

Denotrain offers the possibility of storing cookies via a `CookieStorage`. The framework automatically sets a cookie for this purpose. The value of the cookie is called a ticket. This ticket is client-specific. `ctx.cookies` is an object that returns the values assigned to the ticket. To add new values or to change or delete existing values, only the object `ctx.cookies` has to be changed.
Immediately after sending, the changes to the object are identified and forwarded to the `CookieStorage`.

### Usage

In order to set or delete values, only `ctx.cookies` must be manipulated. Changes are stored in the `CookieStorage` by the framework itself after sending the request. The value can be either a string, a number or a boolean value.

```ts
const app = new Application();
app.get("/route", (ctx) => {
  // Set a cookie with the key "user" and the value 5
  ctx.cookies["user"] = 5;

  // Delete a cookie with the key "foo"
  delete ctx.cookie["foo"];

  // end a session and invalidate ticket
  ctx.endSession();
});
```

### Configuration

The `CookieStorage` can be adjusted in the options when constructing the application. By default a `MemoryCookieStorage` is used, whose stored values are not persisted when a server is restarted. This behavior is not recommended in production environments. The key specifies under which HTTP cookie key the ticket is stored. The cookie options specify the storage duration and storage options of the HTTP cookie for the ticket.

Part of the possible `AppOptions`

```ts
{
  [ ... ]

  cookieStorage?: CookieStorage = new MemoryCookieStorage();
  cookieKey?: string = "train.ticket";
  cookieOptions?: CookieOptions = { maxAge: 60 * 60 * 24 };
  /* change this secret to prevent session hijacking! */
  cookieSecret?: string;

  [ ... ]
  
}
```

### Write your own CookieStorage

By default, cookies are stored in the `MemoryCookieStorage`. This is not persistent and all stored values are destroyed after a server restart. 

To implement a custom `CookieStorage`, the `CookieStorage` interface must be implemented. 

`getCookies()` returns all values that are assigned to the specified ticket. If the ticket is unknown, `undefined` is returned.

`setCookies()` sets the assigned values of a ticket. 

`touch()` can be used by the `CookieStorage` to keep the session current and identify old sessions that are no longer in use. This method is called each time a ticket is used.

`endSession()` deletes a ticket and all associated values.

## Using HTTP cookies directly

The request cookies are automatically parsed by the framework and stored in the object `ctx.req.cookies`. To set a Set-Cookie header in the response, the function `ctx.res.setCookie()` must be called. Here `key` and `value` must be specified. In the options of type `CookieOptions`, `Set-Cookie` specific contraints can be specified, such as `Secure` or `Max-Age`. The function `ctx.res.deleteCookie()` can be used to delete a cookie from the client's cookie memory by specifying a `key`. Here a Set-Cookie header is sent to the client for a cookie that expired in 1970.