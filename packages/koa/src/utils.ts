import Koa from 'koa';
import { Application } from '@feathersjs/feathers';

export type FeathersKoaContext<T = any> = Koa.Context & {
  app: Application<T>;
};
