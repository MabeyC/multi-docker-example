This project is based on Stephen Grider's Udemy Course Docker & Kubernetes: The complete Guide

Architecture:

User submits number ===> React App
                              ||
                              ||
                              \/
                        Express Server
                          ||     ||
                          ||     ||
                          \/      ===
                       Redis        ||
                       ||  /\       \/
     "stores indices   ||  ||     Postgres
     and calculates    \/  ||       "stores a permanent list of indicies that have been received"
     fib as key value
     pairs"            Worker
                        "watches for changes to redis, 
                        pulls each indices, calculates fib and puts back to redis

## To start container in development:
```docker-compose up --build```
# If the above fails: 
```docker-compose down && docker-compose up```

