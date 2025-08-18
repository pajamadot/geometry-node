export function measureTime<T extends (...args: any[]) => any>(func: T): T {
  // @ts-ignore
  return ((...args: any[]) => {
    const startTime = Date.now();

    const result = func(...args);

    if (result instanceof Promise) {
      return result.then((res) => {
        const endTime = Date.now();
        console.log(`===============\n${func.name} took ${(endTime - startTime) / 1000} seconds\n===============`);
        return res;
      });
    } else {
      const endTime = Date.now();
      console.log(`===============\n${func.name} took ${(endTime - startTime) / 1000} seconds\n===============`);
      return result;
    }
  }) as T;
}
