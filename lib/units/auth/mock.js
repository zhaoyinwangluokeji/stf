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
  app.post('/auth/api/v1/mock/modify-password', function (req, res) {
    var log = logger.createLogger('modify-password')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function () {
          req.checkBody('name').notEmpty()
          req.checkBody('email').isEmail()
          req.checkBody('password').notEmpty()
        })
          .then(function () {
            log.info('modify-password "%s"', req.body.email)
            var name = req.body.name
            var email = req.body.email
            var password = req.body.password
            var content = password
            var md5 = crypto.createHash('md5')//定义加密方式:md5不可逆,此处的md5可以换成任意hash加密的方法名称；
            md5.update(content);
            var password_md5 = md5.digest('hex')  //加密后的值d

            dbapi.SetUserPassword({ email: email, name: name }, password_md5).then(function (recv) {
              dbapi.SetUserPasswordFName({ email: email, name: name }, password_md5).then(function (recv) {
                total = recv
                res.status(200)
                  .json({
                    success: true,
                    data: {
                      msg: "Success set password " + password + ","
                        + email + "/" + name
                    }
                  })
              })
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
  app.post('/auth/api/v1/mock/create-account', function (req, res) {
    var log = logger.createLogger('create-account')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function () {
          req.checkBody('name').notEmpty()
          req.checkBody('email').isEmail()
          req.checkBody('password').notEmpty()
        })
          .then(function () {
            log.info('Authenticated CreateAccount "%s"', req.body.email)
            var loaduser1 = dbapi.loadUser(req.body.email)
            var loaduser2 = dbapi.loadUserFName(req.body.name).then(function (cursor) {
              return Promise.promisify(cursor.toArray, cursor)()
                .then(function (list) {
                  console.log("list")
                  var all = []
                  list.forEach(function (d) {
                    all.push(d)
                  })
                  //  console.log("d:" + CircularJSON.stringify(all))
                  return all
                })
            })
            Promise.all([loaduser1, loaduser2])
              .then(function (result) {
                console.log("user name:" + req.body.name)
                console.log("user email:" + req.body.email)
                console.log("length:" + result.length)
                console.log("f1:" + CircularJSON.stringify(result[0]))
                console.log("f2:" + CircularJSON.stringify(result[1]))
                if (((result[0] == null) || result[0].length == 0) &&
                  result[1].length == 0) {
                  console.log("g1")
                  var content = req.body.password  //加密的明文；
                  console.log("password:" + content)
                  var md5 = crypto.createHash('md5');//定义加密方式:md5不可逆,此处的md5可以换成任意hash加密的方法名称；
                  md5.update(content);
                  var password = md5.digest('hex');  //加密后的值d
                  console.log("password 2:" + password)
                  dbapi.registerNewUser({
                    email: req.body.email
                    , name: req.body.name
                    , ip: req.ip
                  }, {
                      email: req.body.email
                      , name: req.body.name
                      , password: password
                    }).then(function () {
                      res.status(200)
                        .json({
                          success: true
                          , redirect: "/auth/mock/success-create-account"
                        })
                    })

                } else {
                  console.log("g2")
                  console.log("g33211")
                  var message = ""
                  if (((result[0] == null) || result[0].length == 0)) {
                    message = "email: " + req.body.email
                  }
                  if (result[1].length > 0) {
                    if (message) {
                      message += " and "
                    }
                    message += "name:" + req.body.name
                  }
                  message += " already exists!"
                  message = "Fail to Create User,reason:" + message
                  res.status(400)
                    .json({
                      success: false
                      , error: 'ValidationError'
                      , data: {
                        "message": message
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

  app.post('/auth/api/v1/mock/getUsers', function (req, res) {
    console.log("post getUsers")
    var log = logger.createLogger('getUsers')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function () {
          req.checkBody('page').notEmpty()
          req.checkBody('count').notEmpty()
          //  req.checkBody('filter').notEmpty()
        })
          .then(function () {
            var page = req.body.page
            var count = req.body.count
            var filter = req.body.filter ? req.body.filter : ""
            var total = 0
            console.log("user page count filter:" + page + "," + count + "," + filter)
            dbapi.loadUsersCount(filter).then(function (recv) {
              total = recv
              dbapi.loadUsers(page, count, filter).then(function (cursor) {
                return cursor.toArray()
              }).then(function (list) {
                var all = []
                list.forEach(function (d) {
                  all.push(d)
                })
                res.status(200)
                  .json({
                    success: true
                    , data: {
                      total: total,
                      datasets: all
                    }
                  })
              })
            })
          })
          .catch(requtil.ValidationError, function (err) {
            log.error('ValidationError error:', err.stack)
            res.status(400)
              .json({
                success: false
                , error: 'ValidationError'
              })
          })
          .catch(function (err) {
            log.error('Unexpected error:', err.stack)
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

  app.post('/auth/api/v1/mock/getGroup', function (req, res) {
    console.log("post getGroup")
    var log = logger.createLogger('getGroup')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function () {
          req.checkBody('page').notEmpty()
          req.checkBody('count').notEmpty()
          //  req.checkBody('filter').notEmpty()
        })
          .then(function () {
            var page = req.body.page
            var count = req.body.count
            var filter = req.body.filter
            var total = 0
            console.log("group,page count filter:" + page + "," + count + "," + filter)
            dbapi.loadUserGroupCount(filter).then(function (recv) {
              total = recv
              dbapi.loadUserGroups(page, count, filter).then(function (cursor) {
                return cursor.toArray()
              }).then(function (list) {
                var all = []
                list.forEach(function (d) {
                  all.push(d)
                })
              //  console.log(JSON.stringify(all))
                res.status(200)
                  .json({
                    success: true
                    , data: {
                      total: total,
                      datasets: all
                    }
                  })
              })
            })
          })
          .catch(requtil.ValidationError, function (err) {
            log.error('ValidationError error:', err.stack)
            res.status(400)
              .json({
                success: false
                , error: 'ValidationError'
              })
          })
          .catch(function (err) {
            log.error('Unexpected error:', err.stack)
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
  app.post('/auth/api/v1/mock/ResetUserPassword', function (req, res) {
    console.log("ResetUserPassword")
    var log = logger.createLogger('ResetUserPassword')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function () {
          req.checkBody('email').notEmpty()
          req.checkBody('name').notEmpty()
        })
          .then(function () {
            var email = req.body.email
            var name = req.body.name
            console.log("reset email,name:" + email + "/" + name)
            dbapi.ResetPassword(email, name).then(function (recv) {
              total = recv
              res.status(200)
                .json({
                  success: true,
                  msg: "Success set password 888888,"
                    + email + "/" + name
                })
            })
          })
          .catch(requtil.ValidationError, function (err) {
            log.error('ValidationError error:', err.stack)
            res.status(400)
              .json({
                success: false
                , error: 'ValidationError'
              })
          })
          .catch(function (err) {
            log.error('Unexpected error:', err.stack)
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

  app.post('/auth/api/v1/mock/newGroup', function (req, res) {
    console.log("newGroup")
    var log = logger.createLogger('newGroup')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function () {
          req.checkBody('group').notEmpty()
        }).then(function () {
          var group = req.body.group
          dbapi.loadGroupFName(group).then(function (result) {
            return result.toArray()
          }).then(function (list) {
            if (list.length == 0) {
              dbapi.newGroup(group).then(function (result) {
                res.status(200)
                  .json({
                    success: true
                    , data: 'Success to creaate user'
                  })
              }).catch(function (err) {
                log.error('Unexpected error:', err.stack)
                res.status(200)
                  .json({
                    success: false
                    , data: err
                  })
              })
            } else {
              res.status(200)
                .json({
                  success: false
                  , data: 'Fail to create!,user group exists,' + list.length
                })
            }
          })

        })
          .catch(requtil.ValidationError, function (err) {
            log.error('ValidationError error:', err.stack)
            res.status(400)
              .json({
                success: false
                , error: 'ValidationError'
              })
          })
          .catch(function (err) {
            log.error('Unexpected error:', err.stack)
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

  app.post('/auth/api/v1/mock/ModifyGroup', function (req, res) {
    console.log("ModifyGroup")
    var log = logger.createLogger('ModifyGroup')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function () {
          req.checkBody('group').notEmpty()
          req.checkBody('new_group').notEmpty()
        }).then(function () {
          var group = req.body.group
          var new_group = req.body.new_group
          dbapi.modifyGroup(group, new_group).then(function (list) {
            res.status(200)
              .json({
                success: true
                , data: 'success to modify group to:' + new_group
              })
          })
        }).catch(requtil.ValidationError, function (err) {
          log.error('ValidationError error:', err.stack)
          res.status(400)
            .json({
              success: false
              , error: 'ValidationError'
            })
        }).catch(function (err) {
          log.error('Unexpected error:', err.stack)
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

  app.post('/auth/api/v1/mock/DeleteGroup', function (req, res) {
    console.log("DeleteGroup")
    var log = logger.createLogger('DeleteGroup')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function () {
          req.checkBody('group').notEmpty()
        }).then(function () {
          var group = req.body.group
          dbapi.deleteGroup(group).then(function (list) {
            res.status(200)
              .json({
                success: true
                , data: 'success to delete group:' + group
              })
          })
        }).catch(requtil.ValidationError, function (err) {
          log.error('ValidationError error:', err.stack)
          res.status(400)
            .json({
              success: false
              , error: 'ValidationError'
            })
        }).catch(function (err) {
          log.error('Unexpected error:', err.stack)
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

  app.post('/auth/api/v1/mock/AddUserToGroup', function (req, res) {
    console.log("AddUserToGroup")
    var log = logger.createLogger('AddUserToGroup')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function () {
          req.checkBody('group').notEmpty()
        }).then(function () {
          var groupname = req.body.group
          var userslist = req.body.userslist

          dbapi.loadGroupFName(groupname).then(function (result) {
            return result.toArray()
          }).then(function (list) {
            var group = list[0]
            var userslist_s = group.userslist
            if (!userslist_s) userslist_s = []
            userslist.forEach(element => {
              var find = false
              userslist_s.forEach(ele => {
                if (ele.name == element.name && ele.email == ele.email) {
                  find = true
                  return false
                }
              })
              if (find == false) {
                userslist_s.push(element)
              }
            })
            //  console.log("SetUsersListOfGroup:" + JSON.stringify(userslist_s))
            dbapi.SetUsersListOfGroup(groupname, userslist_s).then(function () {
              res.status(200)
                .json({
                  success: true
                  , data: 'success to add user to group:' + groupname
                })
            })

          })
        }).catch(requtil.ValidationError, function (err) {
          log.error('ValidationError error:', err.stack)
          res.status(400)
            .json({
              success: false
              , error: 'ValidationError'
            })
        }).catch(function (err) {
          log.error('Unexpected error:', err.stack)
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

  app.post('/auth/api/v1/mock/RemoveUserOfGroup', function (req, res) {
    console.log("RemoveUserOfGroup")
    var log = logger.createLogger('RemoveUserOfGroup')
    log.setLocalIdentifier(req.ip)
    switch (req.accepts(['json'])) {
      case 'json':
        requtil.validate(req, function () {
          req.checkBody('group').notEmpty()
        }).then(function () {
          var groupname = req.body.group
          var userslist = req.body.userslist
          dbapi.loadGroupFName(groupname).then(function (result) {
            return result.toArray()
          }).then(function (list) {
            //  console.log("remove:" + groupname + ":" + JSON.stringify(userslist))
            var newlist = []
            var group = list[0]
            var userlist_s = group.userslist
            if (!userlist_s) userlist_s = []
            userlist_s.forEach(element => {
              var find = false
              userslist.forEach(ele => {
                if (ele.email == element.email && ele.name == element.name) {
                  find = true
                }
              })
              if (find == false) {
                newlist.push(element)
              }
            })
            //  console.log("SetUsersListOfGroup:" + JSON.stringify(newlist))
            dbapi.SetUsersListOfGroup(groupname, newlist).then(function () {
              res.status(200)
                .json({
                  success: true
                  , data: 'success to add user to group:' + groupname
                })
            })

          })
        }).catch(requtil.ValidationError, function (err) {
          log.error('ValidationError error:', err.stack)
          res.status(400)
            .json({
              success: false
              , error: 'ValidationError'
            })
        }).catch(function (err) {
          log.error('Unexpected error:', err.stack)
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
