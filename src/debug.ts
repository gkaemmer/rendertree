const DEBUG = true;

function debug(...values: any[]) {
  if (DEBUG) {
    console.log(...values);
  }
}
