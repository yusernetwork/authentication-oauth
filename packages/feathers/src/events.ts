import { NextFunction } from '@feathersjs/hooks';
import { EventEmitter } from 'events';

import { Service, HookContext } from './declarations';
import { SERVICE, getServiceOptions } from './service';

export async function eventHook (context: HookContext, next: NextFunction) {
  const { methods, events } = getServiceOptions(context.service);
  const value = (methods as any)[context.method];

  // If there is one configured, set the event on the context
  // So actual emitting the event can be disabled within the hook chain
  if (value.event) {
    context.event = value.event;
  }

  await next();

  // Send the event only if the service does not do so already (indicated in the `events` option)
  // This is used for custom events and for client services receiving event from the server
  if (typeof context.event === 'string' && !events.includes(context.event)) {
    const results = Array.isArray(context.result) ? context.result : [ context.result ];

    results.forEach(element => context.service.emit(context.event, element, context));
  }
}

export function eventMixin (service: Service<any>, _path: string, _options?: any) {
  const { methods } = (service as any)[SERVICE];
  const isEmitter = typeof service.on === 'function' &&
    typeof service.emit === 'function';
  // We register the event hook on every configured service method
  // Usually not necessayr but it does allow for the configuration to be changed later
  const eventHooks = Object.keys(methods).reduce((result, key) => {
    result[key] = [ eventHook ];

    return result;
  }, {} as any);

  if (!isEmitter) {
    Object.assign(service, EventEmitter.prototype);
  }
  
  service.hooks(eventHooks);

  return service;
}
