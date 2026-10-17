import { hashKey, type QueryKey } from "@tanstack/react-query";

export const createInvalidationBatcher = (
  flush: (keys: QueryKey[]) => void,
  delayMs: number,
) => {
  const pending = new Map<string, QueryKey>();
  let timer: ReturnType<typeof setTimeout> | null = null;

  const release = () => {
    timer = null;
    const keys = [...pending.values()];
    pending.clear();
    flush(keys);
  };

  const enqueue = (keys: QueryKey[]) => {
    for (const key of keys) pending.set(hashKey(key), key);
    if (timer === null && pending.size > 0)
      timer = setTimeout(release, delayMs);
  };

  const clear = () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    pending.clear();
  };

  return { enqueue, clear };
};
