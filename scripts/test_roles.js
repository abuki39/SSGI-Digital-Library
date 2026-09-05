const http = require('http');

const options = {
  hostname: 'localhost',
  port: import.meta.env.VITE_API_URL + ',
  path: '/api/admin/roles',
  method: 'GET',
  headers: {
    // We need a valid token to bypass auth. I'll just check if it returns 401.
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.end();
