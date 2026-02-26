module.exports = {
  apps: [
    {
      name: 'shikshagraha-app',
      script: '/workspace/node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: 'apps/shikshagraha-app',
      out_file: '/dev/null',
      error_file: '/dev/null',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'registration',
      script: '/workspace/node_modules/.bin/next',
      args: 'start -p 4300',
      cwd: 'mfes/registration',
      out_file: '/dev/null',
      error_file: '/dev/null',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'content',
      script: '/workspace/node_modules/.bin/next',
      args: 'start -p 4301',
      cwd: 'mfes/content',
      out_file: '/dev/null',
      error_file: '/dev/null',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'players',
      script: '/workspace/node_modules/.bin/next',
      args: 'start -p 4108',
      cwd: 'mfes/players',
      out_file: '/dev/null',
      error_file: '/dev/null',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
