var recurlyWebhookServerFactory = require('../index.js');

var recurly = recurlyWebhookServerFactory({
  path: '/',
  username: 'user',
  password: 'pass',
  logger: console
});

recurly.on('Recurly.error', function(err, req){
  console.log('Recurly.error', err);
});

recurly.on('Recurly.new_account_notification', function(data){
  console.log('Recurly.new_account_notification', data);
});

recurly.on('Recurly.*', function(topic, data){
  console.log('*: ' + topic, data);
});

recurly.listen();
