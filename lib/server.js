var Http = require('http');
var auth = require('basic-auth');
var debug = require('debug')('recurly-webhook-server');
var Url = require('url');
var EventEmitter = require('events').EventEmitter;
var Util = require('util');
var Crypto = require('crypto');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();

function reply(statusCode, res) {
  var message = { message: Http.STATUS_CODES[statusCode].toLowerCase() };
  message.result = statusCode >= 400 ? 'error' : 'ok';

  if (message.result == 'error') {
    var err = new Error(message.message);
    this.emit(this.EVENTS.ERROR, err , message);
  }

  message = JSON.stringify(message);

  var headers = {
    'Content-Type': 'application/json',
    'Content-Length': message.length
  };

  res.writeHead(statusCode, headers);
  res.end(message);
}

function parse(data, cb) {
  parser.parseString(data, function(err, result) {
    if (err) return cb(err);
    var event = Object.keys(result)[0];
    cb(null, event, result);
  });
}

function serverHandler(req, res) {

  var self = this;
  var url = Url.parse(req.url, true);
  var buffer = [];
  var bufferLength = 0;
  var failed = false;
  var remoteAddress = req.ip || req.socket.remoteAddress || req.socket.socket.remoteAddress;
  var incomingUsername = '';
  var incomingPassword = '';
  var incomingCredentials;

  req.on('data', function(chunk) {
    if (failed) return;

    buffer.push(chunk);
    bufferLength += chunk.length;
  });

  req.on('end', function(chunk) {
    if (failed) {
      return;
    }

    var data;

    if (chunk) {
      buffer.push(chunk);
      bufferLength += chunk.length;
    }

    self.logger.log(Util.format('received %d bytes from %s', bufferLength, remoteAddress));

    data = Buffer.concat(buffer, bufferLength).toString();

    // Verify credentials
    incomingCredentials = auth(req);
    if (incomingCredentials) {
      incomingUsername = incomingCredentials.name;
      incomingPassword = incomingCredentials.pass;
    }
    if ((incomingUsername !== self.username) || (incomingPassword !== self.password)) {
      debug('Got invalid credentials %s, returning 401', remoteAddress);
      err = new Error('Unauthorized: request contained invalid credentials');
      return reply.call(self, 403, res);
    }

    parse(data, function(err, event, data) {
      // invalid data
      if (err || !event || !data) {
        self.logger.error(Util.format('received invalid data from %s, returning 400', remoteAddress));
        return reply.call(self, 400, res);
      }

      // and now we emit a bunch of data
      self.logger.log(Util.format('got %s event from %s', event, remoteAddress));

      self.emit(self.EVENTS.ALL_SUCCESSFUL_REQUESTS, event, data);
      self.emit('Recurly.' + event, data);

      reply.call(self, 200, res);
    });
  });

  self.logger.log(Util.format(req.method, req.url, remoteAddress));

  // 404 if the path is wrong
  if (url.pathname !== self.path) {
    self.logger.error(Util.format('got invalid path from %s, returning 404', remoteAddress));
    failed = true;
    return reply.call(self, 404, res);
  }

  // 405 if the method is wrong
  if (req.method !== 'POST') {
    self.logger.error(Util.format('got invalid method from %s, returning 405', remoteAddress));
    failed = true;
    return reply.call(self, 405, res);
  }
}

var RecurlyHook = function(options) {
  if (!(this instanceof RecurlyHook)) {
    return new RecurlyHook(options);
  }

  options = options || {};
  this.port = options.port || 3420;
  this.host = options.host || '0.0.0.0';
  this.username = options.username || false;
  this.password = options.password || false;
  this.logger = options.logger || { log: function() {}, error: function() {} };
  this.path = options.path || '/recurly/callback';

  this.EVENTS = {
    ERROR: 'Recurly.error',
    ALL_SUCCESSFUL_REQUESTS: 'Recurly.*'
  };

  this.server = Http.createServer(serverHandler.bind(this));
  EventEmitter.call(this);
};

Util.inherits(RecurlyHook, EventEmitter);

RecurlyHook.prototype.listen = function(callback) {
  var self = this;
  self.server.listen(self.port, self.host, function() {
    self.logger.log(Util.format('listening for Recurly events on %s:%d', self.host, self.port));
    if (typeof callback === 'function') {
      callback();
    }
  });
};

module.exports = RecurlyHook;
