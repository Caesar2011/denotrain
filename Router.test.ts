import { assert, assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { ServerRequest } from './deps.ts';
import { Request } from './Request.ts';
import { Router } from './Router.ts';

async function generateRequest(method: string, url: string) {
    const serverReq = new ServerRequest()
    serverReq.method = 'GET'
    serverReq.url = url
    serverReq.headers = new Headers()

    const req = new Request(serverReq)
    await req.parseInit()

    return req
}

Deno.test('Router with matches', async () => {
  const paths = {
    '/t/user1': 'user1',
    '/t/~user1': '~user1',
    '/t/user1!home': 'user1!home',
  }

  const router = new Router();
  router.get('/t/:slug', (ctx) => { return ctx.req.params })

  for (const [url, slug] of Object.entries(paths)) {
    const req = await generateRequest('GET', url)

    const result = await router.handle({ req } as any, 'onHandle')
    assert(result, `for ${url}`)
    assertEquals(result, { slug })
  }
})

Deno.test('Router with no matches', async () => {
  const router = new Router();
  router.get('/templated/:path', (ctx) => { return ctx.req.params })
  const paths = [
    '/t/my-post/nested',
  ]

  for (const url of paths) {
    const req = await generateRequest('GET', url)
  
    const result = await router.handle({ req } as any, 'onHandle')
    assertEquals(result, undefined, `for ${url}`)
  }
})
