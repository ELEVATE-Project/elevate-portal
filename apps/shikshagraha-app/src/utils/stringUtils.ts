// Format a tenant code for display by capitalizing its separator-delimited words.
export const toPascalCase = (value: string): string =>
  value
    .toLowerCase()
    .replace(/(^\w|[^a-zA-Z0-9]+(\w))/g, (_, first, second) =>
      (first || second).toUpperCase()
    );
