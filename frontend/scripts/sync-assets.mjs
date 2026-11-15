// Keep a single editable asset source. Vite copies these files into its build.
import { cp, mkdir } from "node:fs/promises";
const source = new URL("../../assets/", import.meta.url);
const destination = new URL("../public/assets/", import.meta.url);
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
