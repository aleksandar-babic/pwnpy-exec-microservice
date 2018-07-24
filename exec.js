const {
  createServer
} = require('http');
const {
  writeFileSync,
  unlinkSync
} = require('fs');
const {
  spawn
} = require('child_process');
const getRawBody = require('raw-body');

const PORT = process.env.PORT || 8081;
const MAX_EXEC = process.env.MAX_EXEC || 5000;

const methodNotAllowed = (res) => {
  res.writeHead(405);
  return res.end('Only POST method is allowed.');
};

const malformedRequest = (res) => {
  res.writeHead(400);
  return res.end('Malformed request data.');
};

const logTimestamp = () => {
  return `[${new Date().toUTCString()}]`;
};

const logError = (message) => {
  console.log('\033[31m', `${logTimestamp()} ${message}`, '\x1b[0m');
};

const logSuccess = (message) => {
  console.log('\x1b[32m', `${logTimestamp()} ${message}`, '\x1b[0m');
};

const server = createServer();
server.listen(PORT, () => logSuccess(`Pwnpy Exec microservice running on port ${PORT}.`));

server.on('request', async (req, res) => {
  if (req.method !== 'POST') {
    return methodNotAllowed(res);
  }

  let fileName = '';
  try {
    const buff = await getRawBody(req);
    const unixTimestamp = Date.now();
    fileName = `tmp/recieved_${unixTimestamp}.py`;
    writeFileSync(fileName, buff);
  } catch (err) {
    res.statusCode = 500;
    res.end(err.message);
    logError(err);
  }

  const dockerPyExec = spawn('timeout', [
    '--signal=SIGKILL',
    `${Math.floor(MAX_EXEC / 1000)}s`,
    'docker',
    'container',
    'run',
    '--rm',
    '-v',
    `${__dirname}/${fileName}:/home/run/${fileName}`,
    'python:3-alpine3.8',
    'python',
    `/home/run/${fileName}`
  ]);

  const responseObj = {};

  dockerPyExec.stdout.on('data', (data) => {
    responseObj.stdout = data.toString();
  });

  dockerPyExec.stderr.on('data', (data) => {
    responseObj.stderr = data.toString();
  });

  dockerPyExec.on('close', (code) => {
    responseObj.exitCode = code;
    const msg = (code === null) ? `Process killed because it took more than ${MAX_EXEC}ms to exit.` :
      `Ran ${fileName} with exit code ${code}.`;
    (code === 0) ? logSuccess(msg): logError(msg);
    res.statusCode = 200;
    res.end(JSON.stringify({
      ...responseObj,
      msg
    }));
    unlinkSync(fileName);
  });
});
