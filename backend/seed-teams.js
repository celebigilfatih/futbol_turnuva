const { exec } = require('child_process');

// Run the seed script using npm
exec('npm run seed', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr: ${stderr}`);
  }
  console.log(`Stdout: ${stdout}`);
});