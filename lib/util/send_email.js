url = "http://99.12.95.133:8280/service/email"
var Client = require('node-rest-client').Client;

var client = new Client();


// set content-type header and data as json in args parameter

function send_email(destAdress, ccAddress, subject, body) {
  console.log("send_email")
  this.destAdress = destAdress
  this.ccAddress = ccAddress
  this.subject = 'Your rented cell phone is about to expire'
  if (subject) {
    this.subject = subject
  }
  this.body = "Hello,You phone must to return"
  if (body) {
    this.body = body
  }
  this.args =
    {
      data: {
        destAdress: this.destAdress,
        ccAddress: this.ccAddress,
        subject: this.subject,
        body: this.body
      },
      headers: { "Content-Type": "application/json" }
    };
}

send_email.prototype.send = function () {
  var args = this.args
  var destAdress = this.destAdress
  var subject = this.subject
  return new Promise(function (resolve) {
    console.log("args:" + JSON.stringify(args))
    var req1 = client.post(url, args, function (data, response) {
      resolve(data)
    });
    req1.on('requestTimeout', function (req) {
      console.log("request has expired");
      req.abort();
      resolve('requestTimeout')
    });
    req1.on('responseTimeout', function (res) {
      console.log("response has expired");
      resolve('responseTimeout')
    });
    req1.on('error', function (err) {
      console.log('something went wrong on req1!!', err.request.options);
      resolve('error')
    });


  })
}


module.exports = send_email
