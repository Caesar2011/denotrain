# Body, query and parameters

Denotrain automatically parses URL and query parameters. The body is also parsed automatically if the request header `Content-Type` corresponds to `application/json` or `application/x-www-form-urlencoded`.

## Query Parameters

Query parameters are PArameters in the URL after the question mark. The parameters are parsed automatically. Integers and boolean values (`true` and `false`) are automatically converted.

`/path/to/route?query=parameter&num=123&booleansarecool=true`

Results in `ctx.req.query`:

```json
{
  "query": "parameter",
  "num": 123,
  "booleansarecool": true
}
```

An unparsed query string is found in the variable `ctx.req.rawQuery`. If required: A customized request handler should be implemented one of the first handlers in the `preHandling` hook, since `ctx.req.query` is overwritten in the `Request Init`.

## Path Parameter

Path parameters are dependent on the current route. When specifying the route, parameters are enclosed between two `/` and start with a `:`. All parameters are combined in one object `ctx.req.params`. Integers and Boolan values (`true` and `false`) are parsed automatically.

```ts
const app = Application();
app.get("/path/to/route/:id", (ctx) => {
  return cts.req.params;
});
```

returns in

```
{
  "id": 7
}
```

## Body Parameters

**Attention: `ctx.req.original.body` should not be used.** After the first reading, the reader is fully read and can no longer be evaluated. Instead `ctx.req.getBody()` should be used. This function caches the result after the first read and returns it afterwards. The function `ctx.req.getBodyAsString()` converts the result from `ctx.req.getBody()` into a string and returns it.

If the request header `Content-Type` corresponds to `application/json` or `application/x-www-form-urlencoded` the body will be parsed and stored in `ctx.req.body`. If the body is not well-formed the object stays empty. If the request header `Content-Type` does not exist or match then Body is not evaluated. Integers and Boolan values (`true` and `false`) are parsed automatically.