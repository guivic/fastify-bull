const fastifyPlugin = require('fastify-plugin');
const fastGlob = require('fast-glob');
const path = require('path');
const Queue = require('bull');
const Redis = require('ioredis');

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
	const files = fastGlob.sync(options.paths);
	const queues = {};

	const client = new Redis(options.redisUrl);
	const subscriber = new Redis(options.redisUrl);

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
		const queueName = filename.split('.')[0];

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
