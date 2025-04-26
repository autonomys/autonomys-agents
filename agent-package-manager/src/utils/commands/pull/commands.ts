import ora from 'ora';

// Add a function to run a command and get the output
const runCommandWithOutput = async (
    command: string,
    cwd: string,
  ): Promise<{ stdout: string; stderr: string; code: number | null }> => {
    const { exec } = await import('child_process');
  
    return new Promise((resolve) => {
      const childProcess = exec(command, { cwd }, (error, stdout, stderr) => {
        resolve({
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          code: error?.code !== undefined ? error.code : 0,
        });
      });
    });
  };
  
  // Add a function to run a command without capturing output
  const runCommand = async (
    command: string,
    cwd: string,
    _spinner: ReturnType<typeof ora>,
  ): Promise<void> => {
    const { exec } = await import('child_process');
  
    return new Promise((resolve, reject) => {
      const childProcess = exec(command, { cwd }, (error, _stdout, _stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
  
      // Stream output to console
      childProcess.stdout?.pipe(process.stdout);
      childProcess.stderr?.pipe(process.stderr);
    });
  };

  
export { runCommandWithOutput, runCommand };