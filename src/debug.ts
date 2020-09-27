const DEBUG = true;

export function debug(...values: any[]) {
  if (DEBUG) {
    console.log(...values);
  }
}
