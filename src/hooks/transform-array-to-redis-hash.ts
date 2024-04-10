export const transformArrayToRedisHash = <T>(
    values: T[],
    key: string,
  ): string[] => {
    const data = [];
    for (const element of values) {
      // @ts-ignore
      data.push(element[key]);
      data.push(JSON.stringify(element));
    }
    return data;
  };
