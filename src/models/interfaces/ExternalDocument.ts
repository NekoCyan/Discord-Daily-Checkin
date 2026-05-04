import mongoose from 'mongoose';

export interface DocumentResult<T> {
  _doc: T;
}

export type LeanedDocument<T> =
  | (mongoose.FlattenMaps<T> & {
      _id: mongoose.Types.ObjectId;
    })
  | null;

/**
 * Automatically injects `this: TThis` into all methods of TMethods.
 * Use this for Mongoose statics so no need to repeat `this` per method.
 */
export type WithThis<TThis, TMethods> = {
  [K in keyof TMethods]: TMethods[K] extends (...args: infer A) => infer R
    ? (this: TThis, ...args: A) => R
    : TMethods[K];
};
