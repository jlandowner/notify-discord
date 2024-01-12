export function iso8601(date: Date) {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 6e4);
  return d.toISOString().slice(0, -5) +
    d.toString().match(/[-+]..../)![0].replace(/(..)$/, ":$1");
}
