var chai = require('chai');
var expect = chai.expect;

var recurlyWebhookServerFactory = require('../index.js');
var server;

beforeEach(function(){
  server = recurlyWebhookServerFactory();
});

describe('recurly-webhook-server', function(){

  it('should return a function', function(){
    expect(recurlyWebhookServerFactory).to.be.a('function');
  });

  it('should return an object with a `listen` method', function(){
    expect(server).to.be.an('object');
    expect(server.listen).to.be.a('function');
  });

});
