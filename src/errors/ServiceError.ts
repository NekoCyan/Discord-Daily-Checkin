type ServiceClass = new (...args: never[]) => unknown;

export class ServiceError<T extends object = never> extends Error {
  public readonly context: string;
  public readonly data: T | undefined;

  constructor(service: ServiceClass | string, message: string, data?: T) {
    super(message);
    this.name = 'ServiceError';
    const name = typeof service === 'string' ? service : service.name;
    this.context = name;
    this.data = data;

    Object.setPrototypeOf(this, new.target.prototype);
  }

  toString() {
    const dataStr = this.data ? '\n' + JSON.stringify(this.data, null, 2) : '';

    return `[${this.context}] ${this.message}${dataStr}`;
  }
}
