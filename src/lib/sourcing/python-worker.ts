import { spawn } from "node:child_process";

/**
 * Spawn the Python sourcing worker detached (item requests, batch jobs).
 */
export function spawnPythonWorker(args: string[]): boolean {
  const pythonBin = process.env.PYTHON_BIN ?? "python3";

  try {
    const child = spawn(pythonBin, ["main.py", ...args], {
      cwd: "python",
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}
