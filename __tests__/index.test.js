const Fastify = require('fastify');
const test = require('ava');
const fs = require('fs-extra');
const plugin = require('../index');

/**
 * Create a queue handler.
 * @param {string} dir - The directory where to put the file
 * @param {string} name - The anme of the queue
 */
function createQueueHandler(dir = 'queues', name = 'test') {
	const code = [
		`module.export = {
			name: '${name}',
			handler(fastify, job, done) {
				done();
			},
		};`,
	].join('\n');

	fs.ensureDirSync(dir);

	try {
		const file = `${dir}/${name}.queue.js`;
		if (name === 'empty') {
			fs.writeFileSync(file, '');
		} else {
			fs.writeFileSync(file, code);
		}
	} catch (err) {
		console.error(err);
	}
}

test('fastify.queues namespace should exist', async (t) => {
	createQueueHandler();
	const fastify = Fastify();

	fastify.register(plugin, {
		paths: 'queues/**/*.queue.js',
	});
	await fastify.ready();

	t.assert(fastify.queues);
	t.assert(fastify.queues.test);
	t.is(fastify.queues.test.constructor.name, 'Queue');
});

test('fastify.empty namespace should not exist', async (t) => {
	createQueueHandler('empty', 'empty');
	const fastify = Fastify();

	fastify.register(plugin, {
		paths: 'empty/**/*.queue.js',
	});
	await fastify.ready();

	t.assert(fastify.queues);
	t.true(fastify.queues.empty === undefined);
});

test.after.always(() => {
	fs.removeSync('queues');
	fs.removeSync('empty');
});
