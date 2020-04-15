'use strict'

const fs = require('fs');
const rimraf = require("rimraf");
const t = require('tap');
const plugin = require('./index')
const Fastify = require('fastify')

function createQueueHandler(dir='queues', name='test') {
  let code = `
  export const name = '${name}';
  export async function handler(server, job, done){
    done()
  }
  `

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });

    try {
      let file = `${dir}/${name}.js`
      fs.writeFileSync(file, code);
    } catch (err) {
      console.error(err);
    }
  }
}

t.tearDown(() => {
  rimraf.sync(`queues`);
  rimraf.sync(`some`);
})

t.test('fastify.queues namespace should exist', (t) => {
  t.plan(3)

  const fastify = Fastify()
  fastify.register(require('fastify-redis'), {host: '127.0.0.1' })
  fastify.register(plugin, { connection: fastify.redis})

  fastify.ready((err) => {
    t.error(err)
    t.ok(fastify.queues)
    t.notok(fastify.queues.test)
    fastify.close()
  })

})

t.test('fastify.queues namespace should exist', (t) => {
  t.plan(3)
  createQueueHandler()
  const fastify = Fastify()
  fastify.register(require('fastify-redis'))
  fastify.register(plugin)

  fastify.ready((err) => {
    t.error(err)
    t.ok(fastify.queues)
    t.ok(fastify.queues.test.add({queue: 'hello'}))
    fastify.queues.test.close()
    fastify.close()
  })
})

t.test('Should create queue in recursive folders', (t) => {
  t.plan(3)
  createQueueHandler('some/nested/queue', 'nested')
  const fastify = Fastify()
  fastify.register(require('fastify-redis'), {host: '127.0.0.1' })
  fastify.register(plugin, { path: 'nested', prefix: ['some'],  connection: fastify.redis })

  fastify.ready((err) => {
    t.error(err)
    t.ok(fastify.queues)
    t.ok(fastify.queues.nested)
    fastify.queues.nested.close()
    fastify.close()
  })
})
