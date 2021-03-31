
const keys = require('./keys.js');

// Express App Setup
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Postgres Client Setup
const { Pool } = require('pg');
const pgClient = new Pool({
   user: keys.pgUser,
   host: keys.pgHost,
   database: keys.pgDatabase,
   password: keys.pgPassword,
   port: keys.pgPort
});

pgClient.on('error', () => console.log('Lost PG Connection'));

// Init Postgres by creating a table named "values" if none exist
pgClient.on('connect', () => {
  pgClient
    .query('CREATE TABLE IF NOT EXISTS values (number INT)')
    .catch((err) => console.log(err));
});

// Redis Client Setup
const redis = require('redis');
const redisClient = redis.createClient({
   host: keys.redisHost,
   port: keys.redisPort,
   retry_strategy: () => 1000
});

// We need a duplicate connect in both files, as clients are single purpose
const redisPublisher = redisClient.duplicate();

// Express Route Handlers
app.get('/', (req, res) => {
   res.send('Hi');
});

app.get('/values/all', async (req, res) => {
   // Retreive all indices
   try {
      const values = await pgClient.query('SELECT * FROM values');
      res.send(values.rows) // Only send info
   } catch (err) {
      console.log(err);
   }
});

app.get('/values/current', async (req, res) => {
   try {
   // Reach into redis and retreive all values that have ever been submitted
   redisClient.hgetall('values', (err, values) => {
      // Need to use a callback here, unless we promisify redis
      res.send(values);
   });
   } catch (err) {
      console.log(err);
   }
   
});

app.post('/values', async (req, res) => {
   try {
      const index = req.body.index;
      // Cap size of index at 40 to prevent computational lockout
      if (parseInt(index) > 40) {
         return res.status(422).send('Index too high');
      }
      // Push value to redis
      redisClient.hset('values', index, 'Nothing yet!');
      // Tell redis to calculate the fib value
      redisPublisher.publish('insert', index);
      // Store index in postgres
      pgClient.query('INSERT INTO values(number) VALUES($1)', [index])
      // Respond to client
      res.send({working: true});
   } catch (err) {
      console.log(err)
   }
});

app.listen(5000, err => console.log(`Express Server Listening on Port 5000`));