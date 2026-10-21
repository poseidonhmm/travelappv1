import { test } from 'node:test';
import assert from 'node:assert/strict';
import { server } from './server.js';
test('serves the planner and assets, rejects unknown paths', async () => {
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try {
    const base=`http://127.0.0.1:${server.address().port}`;
    const home=await fetch(base); assert.equal(home.status,200); assert.match(await home.text(),/id="trip-form"/);
    for(const [path,type] of [['/app.js','text/javascript'],['/style.css','text/css']]) { const r=await fetch(base+path); assert.equal(r.status,200); assert.ok(r.headers.get('content-type').startsWith(type)); assert.ok((await r.text()).length>100); }
    assert.equal((await fetch(base+'/missing')).status,404);
    assert.equal((await fetch(base+'/%2e%2e/package.json')).status,404);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
