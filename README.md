# fastify-bull
[![dependencies status](https://david-dm.org/jerrythomas/fastify-bull/status.svg)](https://david-dm.org/jerrythomas/fastify-bull#info=dependencies)
[![dev-dependencies status](https://david-dm.org/jerrythomas/fastify-bull/dev-status.svg)](https://david-dm.org/jerrythomas/fastify-bull#info=devDependencies)
[![Build Status](https://travis-ci.org/jerrythomas/fastify-bull.svg?branch=master)](https://travis-ci.org/jerrythomas/fastify-bull)
[![npm version](https://badge.fury.io/js/fastify-bull.svg)](https://badge.fury.io/js/fastify-bull)

Use bull queues from your fastify application. Utilize fastify decorators to access shared connections, logger etc.

## Installation

```bash
npm install fastify-bull --save

yarn add fastify-bull
```

## Usage

### Queue Handler

An example queue handler.

```ts
// Queues/my-queue/index.ts
import {FastifyInstance} from 'fastify';
import {Job, DoneCallback} from 'bull';

export const name = 'my-queue';

export async function handler(server:FastifyInstance, job: Job<any>, done: DoneCallback){
  /* queue processing logic here */
  done()
}
```

### Adding to fastify

```ts
import fastify from "fastify";
import { Server, IncomingMessage, ServerResponse } from "http";

const server: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({logger:true});

server.register(require('fastify-bull'), {
  path:'queues',
  redisUrl: process.env.REDIS_URL
})

const start = async () => {
  try {
    await server.listen(3000, "0.0.0.0");

    // add an item to the queue
    server.queues['my-queue'].add({hello:'world'}, {priority: 1})

  } catch (err) {
    console.log(err);
    server.log.error(err);
    process.exit(1);
  }
};

process.on("uncaughtException", error => {
  console.error(error);
});
process.on("unhandledRejection", error => {
  console.error(error);
});

start();
```

### Adding a task to the queue

```ts
fastify.queues['my-queue'].add({data:'some data'})
```

## Options

* path: specify folder where queue handlers are present. Exclude to use the default folder 'queues'
* prefix: Prefix folders to scan for the 'queues'. Default is ['.', 'dist', 'src'].

## Author
Jerry Thomas
Forked from @guivic/fastify-bull by Ludovic Lérus from [Guivic](https://guivic.io)

## License

Licensed under [MIT](./LICENSE).
