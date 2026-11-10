/** Keep server-only environment reads dynamic so production host settings can be supplied at runtime. */
export function runtimeEnv(name: string) {
  return process.env[name];
}
