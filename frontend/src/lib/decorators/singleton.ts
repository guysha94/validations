import type { Constructor } from "~/domain";

export function Singleton<T extends Constructor = Constructor>(Base: T): T {
  let instance: InstanceType<T> | undefined;

  return class extends Base {
    constructor(...args: any[]) {
      if (instance) {
        return instance;
      }

      super(...args);
      instance = this as InstanceType<T>;
    }
  } as T;
}
