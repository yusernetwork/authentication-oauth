import { Middleware, HookManager, hooks, HookContext } from '@feathersjs/hooks';
import { Service, ServiceOptions, Application } from '../declarations';

export class ServiceHookManager<A> extends HookManager {
  app: A;

  constructor (app: A) {
    super();
    this.app = app;
  }

  getMiddleware (): Middleware[] {
    return super.getMiddleware();
  }

  initializeContext (self: any, args: any[], context: HookContext): HookContext {
    const ctx = this._parent ? this._parent.initializeContext(self, args, context) : context;

    ctx.arguments = args;

    return ctx;
  }
}

export function hookMixin (this: Application, service: Service<any>, path: string, options: ServiceOptions<any>) {
  if (typeof service.hooks !== 'function') {
    const app = this;
    const hookMap = Object.keys(options.methods).reduce((res, name) => {
      const value = options.methods[name];

      res[name] = new ServiceHookManager(app).params(...value.arguments).props({
        path,
        service,
        app
      });

      return res;
    }, {} as any);

    hooks(service, hookMap);

    Object.defineProperty(service, 'hooks', {
      enumerable: true,
      value (this: any, hookMap: any) {
        hooks(this, hookMap);
      }
    });
  }
}
