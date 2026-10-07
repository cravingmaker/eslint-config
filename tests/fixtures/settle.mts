/**
Waits for every promise in `promises` and keeps the values of those that fulfill.
*/
export async function settle<Value>(
  promises: ReadonlyArray<Promise<Value>>,
): Promise<readonly Value[]> {
  const results = await Promise.allSettled(promises);
  return results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
}
