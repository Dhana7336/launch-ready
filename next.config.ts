import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Pins the workspace root to this project, since a stray lockfile in the
  // parent home directory otherwise causes Next.js to mis-infer it.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
