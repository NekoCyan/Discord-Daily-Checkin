import { PageEntry, PageFetchResult, PageMeta } from '../../../types/index.js';

/**
 * Identity helper that preserves the generic `T` inferred from `fetch`,
 * propagating it into `render` without requiring `any` or manual annotations.
 * Returns `PageEntry<unknown>` so the result is safe to put in `PageController`'s array.
 *
 * @example
 * definePage({
 *   label: 'My Page',
 *   fetch: async () => myService.getData(), // T inferred here
 *   render: (data) => ({ content: data.name }), // data is fully typed
 * })
 */
export function definePage<T>(entry: PageEntry<T>): PageEntry<unknown> {
  const { render, ...rest } = entry;
  return {
    ...rest,
    ...(render ? { render: (data: unknown) => render(data as T) } : {}),
  };
}

/**
 * Wraps the fetched data together with metadata overrides so that
 * `PageController` can update a page's `label`, `style`, `once`, or
 * `onceBehavior` dynamically after each fetch.
 *
 * @example
 * fetch: async () => {
 *   const info = await service.getInfo();
 *   return pageResult(info, {
 *     label: info.isChecked ? '\u2705 Check-In' : '\u274c Check-In',
 *     style: info.isChecked ? ButtonStyle.Success : ButtonStyle.Danger,
 *   });
 * }
 */
export function pageResult<T>(data: T, meta: PageMeta): PageFetchResult<T> {
  return { __tag: 'PageFetchResult', data, meta };
}

/** @internal */
export function isPageFetchResult(v: unknown): v is PageFetchResult<unknown> {
  return (
    typeof v === 'object' &&
    v !== null &&
    (v as Record<string, unknown>).__tag === 'PageFetchResult'
  );
}
