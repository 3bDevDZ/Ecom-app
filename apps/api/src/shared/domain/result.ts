/**
 * Result type for handling success/failure scenarios
 *
 * Provides a functional approach to error handling without exceptions.
 * Inspired by Result types in functional programming.
 *
 * @example
 * // Success case
 * const result = Result.ok<User>(user);
 * if (result.isSuccess) {
 *   console.log(result.value);
 * }
 *
 * // Failure case
 * const result = Result.fail<User>('User not found');
 * if (result.isFailure) {
 *   console.log(result.error);
 * }
 */
export class Result<T> {
  public isSuccess: boolean;
  public isFailure: boolean;
  public error?: string | string[];
  private _value?: T;

  private constructor(isSuccess: boolean, error?: string | string[], value?: T) {
    if (isSuccess && error) {
      throw new Error('InvalidOperation: A result cannot be successful and contain an error');
    }
    if (!isSuccess && !error) {
      throw new Error('InvalidOperation: A failing result needs to contain an error message');
    }

    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this.error = error;
    this._value = value;

    Object.freeze(this);
  }

  public get value(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot retrieve the value from a failed result. Check isSuccess before accessing value.');
    }

    return this._value as T;
  }

  public get errorValue(): string {
    if (Array.isArray(this.error)) {
      return this.error.join(', ');
    }
    return this.error || '';
  }

  public static ok<U>(value?: U): Result<U> {
    return new Result<U>(true, undefined, value);
  }

  public static fail<U>(error: string | string[]): Result<U> {
    return new Result<U>(false, error);
  }

  public static combine(results: Result<any>[]): Result<any> {
    for (const result of results) {
      if (result.isFailure) {
        return result;
      }
    }
    return Result.ok();
  }
}

/**
 * Type alias for results that don't return a value
 */
export type VoidResult = Result<void>;
