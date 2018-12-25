var http = require('http')

var express = require('express')
var validator = require('express-validator')
var cookieSession = require('cookie-session')
var bodyParser = require('body-parser')
var serveStatic = require('serve-static')
var csrf = require('csurf')
var Promise = require('bluebird')
var basicAuth = require('basic-auth')

var logger = require('../../util/logger')
var requtil = require('../../util/requtil')
var jwtutil = require('../../util/jwtutil')
var pathutil = require('../../util/pathutil')
var urlutil = require('../../util/urlutil')
var lifecycle = require('../../util/lifecycle')

var dbapi = require('../../db/api')
var CircularJSON = require('circular-json')
var crypto = require('crypto')

module.exports = function (options) {
  var log = logger.createLogger('auth-mock')
  var app = express()
  var server = Promise.promisifyAll(http.createServer(app))

  lifecycle.observe(function () {
    log.info('Waiting for client connections to end')
    return server.closeAsync()
      .catch(function () {
        // Okay
      })
  })

  // BasicAuth Middleware
  var basicAuthMiddleware = function (req, res, next) {
    function unauthorized(res) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required')
      return res.send(401)
    }

    var user = basicAuth(req)

    if (!user || !user.name || !user.pass) {
      return unauthorized(res)
    }

    if (user.name === options.mock.basicAuth.username &&
      user.pass === options.mock.basicAuth.password) {
      return next()
    }
    else {
      return unauthorized(res)
    }
  }

  app.set('view engine', 'pug')
  app.set('views', pathutil.resource('auth/mock/views'))
  app.set('strict routing', true)
  app.set('case sensitive routing', true)

  app.use(cookieSession({
    name: options.ssid
    , keys: [options.secret]
  }))
  app.use(bodyParser.json())
  app.use(csrf())
  app.use(validator())
  
  app.use('/static/bower_components', serveStatic(pathutil.resource('bower_components')))
  app.use('/static/auth/mock', serveStatic(pathutil.resource('auth/mock')))
  app.use('/static/auth/mock/create-account', serveStatic(pathutil.resource('auth/mock/scripts/create-account/index.js')))
  app.use('/static/auth/mock/modify-password', serveStatic(pathutil.resource('auth/mock/scripts/modify-password/index.js')))
  app.use('/static/auth/mock/success-create-account', serveStatic(pathutil.resource('auth/mock/scripts/create-account/success-create-account/index.js')))


  app.use(function (req, res, next) {
    res.cookie('XSRF-TOKEN', req.csrfToken())
    next()
  })

  if (options.mock.useBasicAuth) {
    app.use(basicAuthMiddleware)
  }

  app.get('/', function (req, res) {
    res.redirect('/auth/mock/')
  })

  app.get('/auth/mock/', function (req, res) {
    res.render('index')
  })
  app.get('/auth/mock/create-account', function (req, res) {
    res.render('index')
  })
  app.get('/auth/mock/modify-password', function (req, res) {
    res.render('index')
  })
  app.get('/auth/mock/success-create-account', function (req, res) {
    res.render('index')
  })


  app.post('/auth/api/v1/mock', function (req, res) {
    var log = logger.createLogger('auth-mock')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function () {
          req.checkBody('name').notEmpty()
          req.checkBody('email').isEmail()
          req.checkBody('password').notEmpty()
        })
          .then(function () {
            log.info('Authenticated "%s"', req.body.email)

            var user
            var password
            dbapi.loadUser(req.body.email).then(function (result) {
              //  console.log("result user:" + JSON.stringify(result))
              user = result
              if (user == null) {
                console.log("result user:null")

                res.status(400)
                  .json({
                    success: false
                    , error: 'ValidationError'
                    , data: {
                      message: "Users Not exists"
                    }
                  })

              } else {

                dbapi.loadPassword(req.body.email)
                  .then(function (cursor) {
                    return cursor.toArray()
                  })
                  .then(function (datas) {

                    if (datas.length == 0) {
                      console.log("resultpassword=null")
                      var content = "888888"  //加密的明文；
                      var md5 = crypto.createHash('md5')//定义加密方式:md5不可逆,此处的md5可以换成任意hash加密的方法名称；
                      md5.update(content);
                      password = md5.digest('hex')  //加密后的值d

                    } else {
                      console.log("result.password")
                      password = datas[0].password
                    }
                    console.log("加密的结果password0：" + password)
                    var md5 = crypto.createHash('md5')
                    md5.update(req.body.password)
                    var password_register = md5.digest('hex')
                    console.log("加密的结果password1：" + password_register)

                    if (password_register == password) {

                      var token = jwtutil.encode({
                        payload: {
                          email: req.body.email
                          , name: req.body.name
                          , password: req.body.password
                        }
                        , secret: options.secret
                        , header: {
                          exp: Date.now() + 24 * 3600
                        }
                      })
                      res.status(200)
                        .json({
                          success: true
                          , redirect: urlutil.addParams(options.appUrl, {
                            jwt: token
                          })
                        })
                      //  req.session.jwt = data
                      //  res.redirect(redir)

                    } else {
                      //  res.send('User Password Error')
                      res.status(400)
                        .json({
                          success: false
                          , error: 'ValidationError'
                          , data: {
                            message: "User Password Error"
                          }
                        })

                    }
                  })

              }

            })

          })
          .catch(requtil.ValidationError, function (err) {
            res.status(400)
              .json({
                success: false
                , error: 'ValidationError'
                , validationErrors: err.errors
              })
          })
          .catch(function (err) {
            log.error('Unexpected error', err.stack)
            res.status(500)
              .json({
                success: false
                , error: 'ServerError'
              })
          })
        break
      default:
        res.send(406)
        break
    }
  })
  
  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
