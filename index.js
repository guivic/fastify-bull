const fastifyPlugin = require('fastify-plugin');
const fs = require('fs');
const path = require('path');
const Queue = require('bull');
const Redis = require('ioredis');

/**
 * Walk folder path to find queue handlers
 *
 * @param {String} handlerPath - Folder containing the queue handlers
 * @param {String} filter - Filter condition to restrict the types of files
 */
function walk(handlerPath, filter='js$') {
  let filepaths = []

  const files = fs.readdirSync(handlerPath);
  for (let filename of files) {
    const filepath = path.join(handlerPath, filename);
    let ext = path.extname(filename)

    if (fs.statSync(filepath).isDirectory()) {
      filepaths = filepaths.concat(walk(filepath, filter));
    } else if (ext.match(filter) !== null){
      filepaths.push(filepath);
    }
  }

  return filepaths;
}

/**
 * Find list of files containing queue handlers
 *
 * @param {Object} fastify - Fastify instance
 * @param {Object} options - Plugin's options containing path and prefix array
 */
function findQueueFiles(fastify, options){
  let handlerPaths = []

  options.prefix.forEach(prefix => {
    handlerPath = path.resolve(`${prefix}/${options.path}`)
    if (fs.existsSync(handlerPath) && fs.lstatSync(handlerPath).isDirectory()){
      handlerPaths.push(handlerPath);
    }
  })
  if (handlerPaths.length > 0){
    return walk(handlerPaths[0])
  }
  return []
}

/**
 * Default on failed handler
 * @param {Object} fastify - Fastify instance
 * @param {Object} error - The Bull error
 */
function defaultOnFailed(fastify, error) {
  fastify.log.error(`${error.queue.name}`);
  fastify.log.error(error);
}

/**
 * Default on error handler
 * @param {Object} fastify - Fastify instance
 * @param {Object} error - The Bull error
 */
function defaultOnError(fastify, error) {
  fastify.log.error(`${error.queue.name}`);
  fastify.log.error(error);
}

/**
 * Load every queue file and decorate the Fastify instance.
 * @param {Object} fastify - Fastify instance
 * @param {Object} options - Plugin's options
 * @param {Function} next - Fastify next callback
 */
function fastifyBull(fastify, options, next) {
  options.prefix = options.prefix || ['.', 'dist', 'src']
  options.path = options.path || 'queues'

  const files = findQueueFiles(fastify, options);
  const queues = {};
  const client = new Redis(options.redisUrl);
  const subscriber = new Redis(options.redisUrl);

  //console.log(walk(options.paths))
  const queueOptions = {
    createClient(type) {
      switch (type) {
      case 'client': return client;
      case 'subscriber': return subscriber;
      default: return new Redis(options.redisUrl);
      }
    },
  };

  if (!options.onFailed) {
    options.onFailed = defaultOnFailed;
  } if (!options.onError) {
    options.onError = defaultOnError;
  }

  for (let i = 0; i < files.length; i++) {
    const queueConfig = require(path.resolve(files[i]));
    const filename = path.basename(files[i]);
    const queueName = queueConfig.name;

    queues[queueName] = new Queue(
      queueConfig.name,
      queueOptions,
    );

    queues[queueName].process((job) => queueConfig.handler(fastify, job));

    queues[queueName].on('error', (error) => options.onError(fastify, error));
    queues[queueName].on('failed', (error) => options.onFailed(fastify, error));
  }

  fastify.decorate('queues', queues);
  next();
}

module.exports = fastifyPlugin(fastifyBull, {
  name: 'fastify-bull',
});
