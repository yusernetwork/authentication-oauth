import { strict as assert } from 'assert';
import { EventEmitter } from 'events';

import { feathers, Id } from '../src';

interface Data {
  id?: Id;
  message: string;
}

describe('Service events', () => {
  it('app is an event emitter', done => {
    const app = feathers();

    assert.strictEqual(typeof app.on, 'function');

    app.on('test', (data: any) => {
      assert.deepStrictEqual(data, { message: 'app' });
      done();
    });
    app.emit('test', { message: 'app' });
  });

  it('a service is an event emitter', done => {
    const app = feathers();

    app.use('/test', {
      async get (id: Id) {
        return { id };
      }
    });

    const service = app.service('test');
    
    assert.equal(typeof service.on, 'function');

    service.on('testing', () => done());
    service.emit('testing', 'test');
  });

  it('works with service that is already an EventEmitter', async () => {
    const app = feathers();
    const service: any = new EventEmitter();

    service.create = function (data: any) {
      return Promise.resolve(data);
    };

    app.use('/emitter', service);

    app.service('emitter').create({
      message: 'testing'
    });

    await new Promise(resolve => service.on('created', (data: any) => {
      assert.deepStrictEqual(data, {
        message: 'testing'
      });
      resolve();
    }));
  });

  describe('emits event data on a service', () => {
    it('.create and created', done => {
      const app = feathers().use('/creator', {
        async create (data: Data) {
          return data;
        }
      });

      const service = app.service('creator');

      service.on('created', (data: Data) => {
        assert.deepStrictEqual(data, { message: 'Hello' });
        done();
      });

      service.create({ message: 'Hello' });
    });

    // it('allows to skip event emitting', done => {
    //   const app = feathers().use('/creator', {
    //     async create (data: Data) {
    //       return data;
    //     }
    //   });

    //   const service = app.service('creator');

    //   service.hooks({
    //     before: {
    //       create (context: any) {
    //         context.event = null;

    //         return context;
    //       }
    //     }
    //   });

    //   service.on('created', (_data: any) => {
    //     done(new Error('Should never get here'));
    //   });

    //   service.create({ message: 'Hello' }).then(() => done());
    // });

    it('.update and updated', done => {
      const app = feathers().use('/creator', {
        async update (id: Id, data: Data) {
          return {
            id,
            ...data
          };
        }
      });

      const service = app.service('creator');

      service.on('updated', (data: Data) => {
        assert.deepStrictEqual(data, { id: 10, message: 'Hello' });
        done();
      });

      service.update(10, { message: 'Hello' });
    });

    it('.patch and patched', done => {
      const app = feathers().use('/creator', {
        async patch (id: Id, data: Data) {
          return {
            id,
            ...data
          };
        }
      });

      const service = app.service('creator');

      service.on('patched', (data: any) => {
        assert.deepStrictEqual(data, { id: 12, message: 'Hello' });
        done();
      });

      service.patch(12, { message: 'Hello' });
    });

    it('.remove and removed', done => {
      const app = feathers().use('/creator', {
        async remove (id: Id) {
          return { id };
        }
      });

      const service = app.service('creator');

      service.on('removed', (data: any) => {
        assert.deepStrictEqual(data, { id: 22 });
        done();
      });

      service.remove(22);
    });
  });

  describe('emits event data arrays on a service', () => {
    const arrayItems: Data[] = [
      { id: 0, message: 'Hello 0' },
      { id: 1, message: 'Hello 1' }
    ];

    class CreateService {
      async create (data: Data|Data[]): Promise<Data|Data[]> {
        if (Array.isArray(data)) {
          return Promise.all(data.map(current => this.create(current) as Promise<Data>));
        }

        return data;
      }

      async update (_id: Id, _data: Partial<Data>) {
        return arrayItems;
      }

      async patch (_id: Id, _data: Partial<Data>) {
        return arrayItems;
      }

      async remove (_id: Id) {
        return arrayItems;
      }
    }

    interface ArrayServiceTypes {
      creator: CreateService
    }

    it('.create and created with array', async () => {
      const app = feathers<ArrayServiceTypes>().use('creator', new CreateService());
      const service = app.service('creator');
      const createItems = [
        { message: 'Hello 0' },
        { message: 'Hello 1' }
      ];

      service.create(createItems);

      await Promise.all(createItems.map((element, index) => new Promise((resolve) =>
        service.on('created', (data: Data) => {
          if (data.message === element.message) {
            assert.deepStrictEqual(data, { message: `Hello ${index}` });
            resolve();
          }
        })
      )));
    });

    it('.update and updated with array', async () => {
      const app = feathers<ArrayServiceTypes>().use('creator', new CreateService());
      const service = app.service('creator');

      service.update(null, {});

      await Promise.all(arrayItems.map((element, index) => new Promise((resolve) => {
        service.on('updated', (data: any) => {
          if (data.message === element.message) {
            assert.deepStrictEqual(data, { id: index, message: `Hello ${index}` });
            resolve();
          }
        })
      })));
    });

    it('.patch and patched with array', async () => {
      const app = feathers<ArrayServiceTypes>().use('creator', new CreateService());
      const service = app.service('creator');

      service.patch(null, {});

      await Promise.all(arrayItems.map((element, index) => new Promise((resolve) => {
        service.on('patched', (data: any) => {
          if (data.message === element.message) {
            assert.deepStrictEqual(data, { id: index, message: `Hello ${index}` });
            resolve();
          }
        });
      })));
    });

    it('.remove and removed with array', async () => {
      const app = feathers<ArrayServiceTypes>().use('creator', new CreateService());
      const service = app.service('creator');

      service.remove(null);

      await Promise.all(arrayItems.map((element, index) => new Promise((resolve) => {
        service.on('removed', (data: any) => {
          if (data.message === element.message) {
            assert.deepStrictEqual(data, { id: index, message: `Hello ${index}` });
            resolve();
          }
        });
      })));
    });
  });

  describe('event format', () => {
    // it('also emits the actual hook object', done => {
    //   const app = feathers().use('/creator', {
    //     create (data: any) {
    //       return Promise.resolve(data);
    //     }
    //   });

    //   const service = app.service('creator');

    //   service.hooks({
    //     after (hook: any) {
    //       hook.changed = true;
    //     }
    //   });

    //   service.on('created', (data: any, hook: any) => {
    //     assert.deepStrictEqual(data, { message: 'Hi' });
    //     assert.ok(hook.changed);
    //     assert.strictEqual(hook.service, service);
    //     assert.strictEqual(hook.method, 'create');
    //     assert.strictEqual(hook.type, 'after');
    //     done();
    //   });

    //   service.create({ message: 'Hi' });
    // });

    it('events indicated by the service are not sent automatically', done => {
      const app = feathers().use('/creator', {
        async create (data: any) {
          return data;
        }
      }, {
        events: ['created']
      });

      const service = app.service('creator');

      service.on('created', (data: any) => {
        assert.deepStrictEqual(data, { message: 'custom event' });
        done();
      });

      service.create({ message: 'hello' })
        .then(() => service.emit('created', { message: 'custom event' }));
    });
  });
});
