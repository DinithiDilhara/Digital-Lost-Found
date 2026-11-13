const backendPort = process.env.PORT ?? "5000";
const backendUrl = process.env.BACKEND_URL ?? `http://127.0.0.1:${backendPort}/api/health`;
const timeoutMs = 60_000;
const retryDelayMs = 250;
const deadline = Date.now() + timeoutMs;

while (Date.now() < deadline) {
  try {
    const response = await fetch(backendUrl);
    if (response.ok) {
      process.exit(0);
    }
  } catch {
    // The backend may still be compiling or starting.
  }

  await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
}

console.error(`Backend did not become ready at ${backendUrl} within ${timeoutMs / 1000} seconds.`);
process.exit(1);
