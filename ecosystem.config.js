module.exports = {
  apps: [
    {
      name: 'shikshagraha-app',
      script: '/workspace/node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: 'apps/shikshagraha-app',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'registration',
      script: '/workspace/node_modules/.bin/next',
      args: 'start -p 4300',
      cwd: 'mfes/registration',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'content',
      script: '/workspace/node_modules/.bin/next',
      args: 'start -p 4301',
      cwd: 'mfes/content',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'players',
      script: '/workspace/node_modules/.bin/next',
      args: 'start -p 4108',
      cwd: 'mfes/players',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
