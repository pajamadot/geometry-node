export function measureTime<T extends (...args: any[]) => any>(func: T): T {
  // @ts-ignore
  return ((...args: any[]) => {
    const startTime = Date.now();
    const name = func.name || 'anonymous';

    const result = func(...args);

    if (result && typeof result.then === 'function') {
      // 异步函数
      return result.then((res: any) => {
        const endTime = Date.now();
        console.log(`===============\n${name} took ${(endTime - startTime) / 1000} seconds\n===============`);
        return res;
      });
    } else {
      // 同步函数
      const endTime = Date.now();
      console.log(`===============\n${name} took ${(endTime - startTime) / 1000} seconds\n===============`);
      return result;
    }
  }) as T;
}