const { redisPort, redisHost } = require('./keys.js');
const redis = require('redis');

// Init client, reconnect every 1 second
const redisClient = redis.createClient({
   host: redisHost,
   port: redisPort,
   retry_strategy: () => 1000
});

const sub = redisClient.duplicate();

// Calculate Fibonacci given an index
// Simulates a slow worker process
function fib(index) {
   if (index < 2) return 1;
   return fib(index - 1) + fib(index - 2);
}

// Set a hash, key is message, and value is the fibonnaci number
sub.on('message', (channel, message) => {
   redisClient.hset('values', message, fib(parseInt(message)))
});

// Listen for redis event
sub.subscribe('insert');