/**
Waits for every promise in `promises` and keeps the values of those that fulfill.
*/
export const settle = async <Value,>(
  promises: ReadonlyArray<Promise<Value>>,
): Promise<readonly Value[]> => {
  const results = await Promise.allSettled(promises);
  return results.flatMap((result) => {
    return result.status === "fulfilled" ? [result.value] : [];
  });
};
