const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5173,
  path: '/api/vwall/images?limit=3',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('API Response:');
      console.log(JSON.stringify(parsed, null, 2));
      
      if (parsed.images && parsed.images.length > 0) {
        console.log('\nFirst image details:');
        console.log('ID:', parsed.images[0].id);
        console.log('Source:', parsed.images[0].source);
        console.log('Image URL:', parsed.images[0].image_url);
        console.log('Thumbnail URL:', parsed.images[0].thumbnail_url);
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.end();