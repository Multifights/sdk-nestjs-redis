export const recordToArray = <T>(data: Record<string, T>): T[] => {
    const values: T[] = [];

    for (const value of Object.values(data)) {
      values.push(value);
    }

    return values;
};
