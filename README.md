# @guivic/fastify-bull
[![dependencies status](https://david-dm.org/guivic/fastify-bull/status.svg)](https://david-dm.org/guivic/fastify-bull#info=dependencies)
[![dev-dependencies status](https://david-dm.org/guivic/fastify-bull/dev-status.svg)](https://david-dm.org/guivic/fastify-bull#info=devDependencies)
![Node.js CI](https://github.com/guivic/fastify-bull/workflows/Node.js%20CI/badge.svg)


Use bull queues from your fastify application. Utilize fastify decorators to access shared connections, logger etc.

## Installation

```bash
npm install @guivic/fastify-bull --save

yarn add @guivic/fastify-bull
```

## Usage

### Queue Handler

An example queue handler.

```js
// queues/example.queue.js

const name = 'example';
function handler(server, job, done) { // Can also be an async handler
  /* queue processing logic here */
  done()
}

module.exports = {
  name,
  handler,
};
```

### Adding to fastify


```js
const fastify = require('fastify');

const server = fastify();

server.register(require('fastify-bull'), {
  paths: 'queues/**/*.queue.js', // Where to look for queues files
})

const start = async () => {
  try {
    await server.listen(3000, "0.0.0.0");

    // add an item to the queue (more information on Bull documentation)
    server.queues['example'].add({ hello: 'world' }, { priority: 1 });

  } catch (err) {
    console.log(err);
    server.log.error(err);
    process.exit(1);
  }
};

start();
```

### Adding a task to the queue

```ts
fastify.queues['my-queue'].add({ data: 'some data' });
```

## Options

* `paths: <String | Array>`  specify folder where queue handlers are present.
* `redisUrl: <String>` The Redis url connection.
* `onFailed: <Function>` Queue handler on "failed" event (by default will log with the fastify logger)
* `onError: <Function>` Queue handler on "error" event (by default will log with the fastify logger)

## Informations

### Bull and Heroku

I use [ioredis](https://github.com/luin/ioredis) for the Redis conneciton. It's preconfigured to share the Redis connection accros queues. It's really usefull on environment like Heroku where you have connection limits.

## Author

Ludovic Lérus from [Guivic](https://guivic.io)

Thanks to [Jerry Thomas](https://github.com/jerrythomas) for his fork

## TODO

- Add the support of fastify-redis
- Add the support of Redis connection Object as options
- Find a way to let people configure the way bull will handle the redis connection
- Add the support for nested directory
- Add default parameters for paths
- Remove the fast-glob dep?

## License

Licensed under [MIT](./LICENSE).