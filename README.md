# Why does this microservice exist?

I'm developing python learning app and it has playground mode where user can write any python code to see its output, so I needed way to safely run (potentially evil) python scripts, and get their STDOUT/STDERR.

# How does it work?
* This service will listen on http at given port from env variable(`PORT`), or fallback to `8081`.
* When it recieves request with python file it will spawn docker container with python interpreter and run it.
* Once execution is done, it will return `STDOUT`, `STDERR` and exit code.

## What if user sends an evil script?
If script takes longer than `MAX_EXEC` (environment variable that limits maximum script running time, defaults to `5000`) time to run, container will be killed and error message will be returned.

# How to run this service?

To run this service:
* Install dependencies with `yarn install`
* Run service with `node exec.js`

> It's recommended to run this service in some kind of process manager (PM2, forever, etc..)

To run this service with nodemon while developing:
* Install dependencies with `yarn install`
* Run `yarn dev`

