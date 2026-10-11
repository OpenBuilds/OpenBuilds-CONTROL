// server.js handles the http server backend for Electron

"use strict";

// System dependencies
const {
  Server: ioServer
} = require('socket.io');
var express = require("express");
var path = require("path");
var ip = require("ip");
var http = require("http");
// var https = require('https');


// App dependencies
const {
  rootDir,
  debug_log,
  status,
  config,
} = require('./core.js');


// Global variables
const io = new ioServer();
const app = express();
var httpServer;
var connectionHandlers = [];
var docReadyHandlers = [];

function addConnectionHandler(handler) {
  removeConnectionHandler(handler);
  connectionHandlers.push(handler);
}

function removeConnectionHandler(handler) {
  let index = connectionHandlers.indexOf(handler);
  if (index >= 0) {
    connectionHandlers.splice(index, 1);
  }
}

function addDocReadyHandler(handler) {
  removeDocReadyHandler(handler);
  docReadyHandlers.push(handler);
}

function removeDocReadyHandler(handler) {
  let index = docReadyHandlers.indexOf(handler);
  if (index >= 0) {
    docReadyHandlers.splice(index, 1);
  }
}

function onDocReady(callback) {
  serverEmit("status", status);
  var result = {
    platform: process.platform,
  };
  docReadyHandlers.forEach((x) => x(result));
  callback(result);
}

function onConnection(socket) {
  debug_log("New IO Connection ");

  connectionHandlers.forEach((x) => x(socket));

  socket.on('docReady', onDocReady);
}

function httpServerSuccess() {
  debug_log('http:  listening on:' + ip.address() + ":" + config.webPort);
}

function httpServerError(error) {
  // If unable to start (port in use) - try next port in array from config.nextWebPort()
  console.error(error.message);
  httpServer.listen(config.nextWebPort());
  status.driver.webport = config.webPort;
}

function initServer() {
  app.use(express.static(path.join(rootDir, "app")));

  app.use(function setCommonHeaders(req, res, next) {
    res.set("Access-Control-Allow-Private-Network", "true");
    next();
  });

  app.all('/*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Private-Network", "true");
    next();
  });

  httpServer = http.Server(app).listen(config.webPort, '0.0.0.0', httpServerSuccess).on('error', httpServerError);
  io.attach(httpServer);

/* Disable HTTPS, since the keys are out of date. It is not practical for a software with infrequent releases to use keys
that expire in 3 months. Besides, the private keys are included in the open source so there is no real security

  //Note when renewing Convert zerossl cert first `openssl.exe rsa -in domain-key.key -out domain-key.key`
  // fix error:    App threw an error during load
  //               Error: error:06000066:public key routines:OPENSSL_internal:DECODE_ERROR

  var httpsOptions = {
    key: fs.readFileSync(path.join(rootDir, 'privkey1.pem')),
    cert: fs.readFileSync(path.join(rootDir, 'fullchain1.pem'))
  };

  const httpsSrever = https.createServer(httpsOptions, app).listen(3001, function() {
    console.log("SUCCESS HTTPS");
    debug_log('https: listening on:' + ip.address() + ":3001");
  });
  io.attach(httpsSrever);
*/

  io.on("connection", onConnection);
}

function serverEmit(event, data) {
  io.sockets.emit(event, data);
}

function serverEmitOutput(data) {
  io.sockets.emit('data', data);
}

module.exports = {
  app,
  serverEmit,
  serverEmitOutput,
  addConnectionHandler,
  removeConnectionHandler,
  addDocReadyHandler,
  removeDocReadyHandler,
  initServer,
};
