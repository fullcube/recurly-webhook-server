# Recurly webhook server

[![Greenkeeper badge](https://badges.greenkeeper.io/fullcube/recurly-webhook-server.svg)](https://greenkeeper.io/)

Webhooks in [Recurly](https://www.recurly.com) notify you when content in your space has changed.

Recurly webhook server is a lightweight server to handle these notifications:

- handles incoming [Recurly webhook HTTP requests](https://docs.recurly.com/api/push-notifications)
- emits events for all Recurly webhook topics to allow easy webhook handling
- supports username/password authentication
- supports all default [node HTTP server](https://nodejs.org/api/http.html) options

## Installation

```bash
$ npm install recurly-webhook-server
```

## Quick example

```javascript
// Create webhook server
var server = require('recurly-webhook-server')({
  path: '/',
  username: 'user',
  password: 'pass'
});

// Attach handlers to Recurly webhooks
server.on('Recurly.new_account_notification', function(req){
  console.log('A new account was created!');
});

// Start listening for requests on port 3000
server.listen(3000, function(){
  console.log('Recurly webhook server running on port ' + 3000)
});

```

## Configuration

You can pass a configuration object when instantiating the server:

```javascript
// Create webhook server
var server = require('recurly-webhook-server')({
  path: '/',
  username: 'user',
  password: 'pass'
});
```

where:

- **path**: the path you want the server to listen on, default: '/'
- **username**: the username you expect the request to contain, default: ''
- **password**: the password you expect the request to contain, default: ''

So to start a server on `localhost:3000` without authentication, you can:

```javascript
// Create server with default options
var server = require('recurly-webhook-server')();

// Start listening for requests on port 3000
server.listen(3000, function(){
  console.log('Recurly webhook server running on port ' + 3000)
});
```

and to start a server on `localhost:3000/webhooks` with authentication, you can:

```javascript
// Create server with default options
var server = require('recurly-webhook-server')({
  path: '/webhooks',
  username: 'user',
  password: 'pass'
});

// Start listening for requests on port 3000
server.listen(3000, function(){
  console.log('Recurly webhook server running on port ' + 3000)
});
```

## Handling incoming webhook requests

The server emits incoming Recurly webhook topics as event, so you can:

```javascript
server.on('Recurly.new_account_notification', function(req){
  console.log('A new account was created!');
});

server.on('Recurly.canceled_account_notification', function(req){
  console.log('An account was cancelled!');
});

server.on('Recurly.billing_info_updated_notification', function(req){
  console.log('Billing info was updated!');
});

server.on('Recurly.reactivated_account_notification', function(req){
  console.log('An account was reactivated!');
});

server.on('Recurly.new_invoice_notification', function(req){
  console.log('A new invoice was created!');
});

server.on('Recurly.processing_invoice_notification', function(req){
  console.log('An invoice is being processed!');
});

server.on('Recurly.closed_invoice_notification', function(req){
  console.log('An invoice was closed!');
});

...
```

> This module does not make any assumptions about your application.

> Incoming XML data is converted to JSON and passed to your handler(s) so you can process (or ignore) the contents of the [incoming message](https://nodejs.org/api/http.html#http_http_incomingmessage) from within your handler(s).


## Special wildcard event

The server emits a special wildcard event too in case you want to listen to all events in one go:

```javascript

// Handler for all successful requests
// Is not emitted when an error occurs
server.on('Recurly.*', function(topic, req){

  // topic is available as string
  // => e.g. Recurly.new_account_notification
  console.log('Request came in for: ' + topic);
});
```

> This event is only emitted on successful requests, not on errors

## Handling errors and invalid requests

When an invalid request comes in, a `Recurly.error` event is emitted:

```javascript
// Handle errors
server.on('Recurly.error', function(err, req){
  console.log(err);
});
```

## Simulating a request using curl

If you want to try out your server during development, you can simulate a request without credentials using cUrl:

```bash
$ curl -X POST --data "[recurly-xml-data-here]" localhost:3000
```

and simulate requests with authentication like this:

```bash
$ curl -X POST -u user:pass --data "[recurly-xml-data-here]" localhost:3000
```

## Enabling webhooks in Recurly

To enable webhooks in your Recurly account, go to your developer settings and fill in the options you specified in your server configuration:

As soon as you save the webhook in Recurly, your server will start receiving notifications.

## Example

A working example is included [here](examples/webhook-server.js).

## License

MIT
