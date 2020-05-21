# Responses

A router handler function can return different values. Different return values and their consequences are listed here. The return value can be either a `Promise` or the value itself.

All following handlers set the response body to JSON and set the mime type accordingly.

```ts
app.get("/", (ctx) => {
  return {"json": "success"};
});

// is equal to

app.get("/", async (ctx) => {
  return {"json": "success"};
});

// is equal to

app.get("/", (ctx) => {
  return new Promise(resolve => resolve({"json": "success"}));
});
```

## Response Values

 - `undefined` | `void`
   
   The function does not return a value and the body is not changed. The following applicable handler functions are *still* executed. The body can still be changed using `ctx.res.setBody()`.

- `true`

   The body is not changed by this function. The following applicable handler functions are *not* executed. The body can still be changed using `ctx.res.setBody()`.

- `Uint8Array`

   The response body is set to this `Uint8Array`. If the MIME-Type is not set yet, it will be set to `application/octet-stream`. The following applicable handler functions are *not* executed.

- `Deno.Reader`

   The response body is set to this `Deno.Reader`. If the MIME-Type is not set yet, it will be set to `application/octet-stream`. The following applicable handler functions are *not* executed.

- `string`

   The response body is set to this `Deno.Reader`. If the MIME-Type is not set yet, it will be set to `text/plain`. The following applicable handler functions are *not* executed.

- any other object (`{ [_: string]: any }`)

   This object will be parsed as string with `JSON.parse()`. If the MIME-Type is not set yet, it will be set to `application/json`. The following applicable handler functions are *not* executed.

## Lifecycle

If a return value is set in a lifecycle hook (for example, in `onRequest`), no further request handlers are executed by this hook (for example, no further `onRequest` handlers), but the next hook (for example, in this case `preParsing`) is executed. Therefore, only in the lifecycle hook `onHandle` should a return value other than `undefined` be set. This ensures that the request is processed correctly. 

To set the body in other handlers, it is recommended to rather use the function `ctx.res.setBody()` and return `undefined` or nothing.

If there is still no return value set after the lifecycle hook `onHandle`, a ClientError (status: 404 Not Found) is thrown.

If a ClientError has been thrown in a lifecycle hook up to and including `onHandle`, then the status and the body will be set accordingly (status code: `e.statusCode`). If another error is thrown, the status and body are also set (status code: 500).