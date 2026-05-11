import { ServiceError } from '../errors/ServiceError.js';

abstract class BaseService {
  /**
   * A helper method to create a ServiceError with the service's name as context.
   * @param message The error message to include in the ServiceError.
   * @param data Optional data object to attach to the error for tracking.
   * @returns A new ServiceError instance.
   */
  protected error<T extends object = never>(message: string, data?: T): ServiceError<T> {
    return new ServiceError<T>(this.constructor.name, message, data);
  }

  static error<T extends object = never>(message: string, data?: T): ServiceError<T> {
    return new ServiceError<T>(this.name, message, data);
  }
}

export default BaseService;
