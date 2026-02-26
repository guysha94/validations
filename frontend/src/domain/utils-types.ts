import type { SortingState } from "@tanstack/react-table";

export type Constructor<T = any> = new (...args: any[]) => T;

export type Result<T> = {
  data?: T | null | undefined;
  error?: Error | null | undefined;
};

export type AsyncResult<T> = Promise<Result<T>>;

export type Optional<T> = T | null | undefined;

export type Nullable<T> = T | null;

export type Maybe<T> = T | undefined;

export type Simplify<T> = { [P in keyof T]: T[P] } & {};

/**
 * A type representing primitive values.
 */
export type Primitive = string | number | bigint | boolean | Date | null;

/**
 * A type representing a string that contains a numeric value.
 */
export type NumericString = `${number}`;

/**
 * A type representing a JSON object.
 */
export type JSONObject = { [key: string]: JSONValue };

/**
 * A type representing a JSON array.
 */
export type JSONArray = JSONValue[];

/**
 * A type representing a JSON value, which can be a primitive, a JSON object, or a JSON array.
 */
export type JSONValue = Primitive | JSONObject | JSONArray;

export type ValidationErrorInfo = {
  index: number;
  tabName: string;
  rowNumber: number;
  errorMessage: string;
};
export type PaginationAndSorting = {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  q: string;
};
