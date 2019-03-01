var http = require('http')
var url = require('url')
var fs = require('fs')

var express = require('express')
var validator = require('express-validator')
var cookieSession = require('cookie-session')
var bodyParser = require('body-parser')
var serveFavicon = require('serve-favicon')
var serveStatic = require('serve-static')
var csrf = require('csurf')
var compression = require('compression')

var logger = require('../../util/logger')
var pathutil = require('../../util/pathutil')

var auth = require('./middleware/auth')
var deviceIconMiddleware = require('./middleware/device-icons')
var browserIconMiddleware = require('./middleware/browser-icons')
var appstoreIconMiddleware = require('./middleware/appstore-icons')

var markdownServe = require('markdown-serve')

var dbapi = require('../../db/api')
var _ = require('lodash')

module.exports = function (options) {
  var log = logger.createLogger('app')
  var app = express()
  var server = http.createServer(app)

  app.use('/static/wiki', markdownServe.middleware({
    rootDirectory: pathutil.root('node_modules/stf-wiki')
    , view: 'docs'
  }))

  app.set('view engine', 'pug')
  app.set('views', pathutil.resource('app/views'))
  app.set('strict routing', true)
  app.set('case sensitive routing', true)
  app.set('trust proxy', true)

  if (fs.existsSync(pathutil.resource('build'))) {
    log.info('Using pre-built resources')
    app.use(compression())
    app.use('/static/app/build/entry',
      serveStatic(pathutil.resource('build/entry')))
    app.use('/static/app/build', serveStatic(pathutil.resource('build'), {
      maxAge: '10d'
    }))
  }
  else {
    log.info('Using webpack')
    // Keep webpack-related requires here, as our prebuilt package won't
    // have them at all.
    var webpackServerConfig = require('./../../../webpack.config').webpackServer
    app.use('/static/app/build',
      require('./middleware/webpack')(webpackServerConfig))
  }

  app.use('/static/bower_components',
    serveStatic(pathutil.resource('bower_components')))
  app.use('/static/app/data', serveStatic(pathutil.resource('data')))
  app.use('/static/app/status', serveStatic(pathutil.resource('common/status')))
  app.use('/static/app/browsers', browserIconMiddleware())
  app.use('/static/app/appstores', appstoreIconMiddleware())
  app.use('/static/app/devices', deviceIconMiddleware())
  app.use('/static/app', serveStatic(pathutil.resource('app')))

  app.use('/static/logo',
    serveStatic(pathutil.resource('common/logo')))
  app.use(serveFavicon(pathutil.resource(
    'common/logo/exports/STF-128.png')))

  app.use(cookieSession({
    name: options.ssid
    , keys: [options.secret]
  }))

  app.use(auth({
    secret: options.secret
    , authUrl: options.authUrl
  }))

  // This needs to be before the csrf() middleware or we'll get nasty
  // errors in the logs. The dummy endpoint is a hack used to enable
  // autocomplete on some text fields.
  app.all('/app/api/v1/dummy', function (req, res) {
    res.send('OK')
  })

  app.use(bodyParser.json())
  app.use(csrf())
  app.use(validator())

  app.use(function (req, res, next) {
    res.cookie('XSRF-TOKEN', req.csrfToken())
    next()
  })

  app.get('/', function (req, res) {
    res.render('index')
  })

  app.get('/app/api/v1/state.js', function (req, res) {

    var user = req.user
    dbapi.loadAllUserGroups().then(function (cursor) {
      return cursor.toArray()
    }).then(function (list) {
      var groups = []
      var is_adminstrator_group = false
      var is_auto_tester_group = false
      var is_project_use_group = false
      var permissions = []
      list.forEach(ele_group => {
        if (ele_group.userslist) {
          ele_group.userslist.forEach(ele_user => {
            if (ele_user.name == user.name && ele_user.email == user.email) {
              groups.push(ele_group)
              if (ele_group.GroupName == "administrator") {
                is_adminstrator_group = true
              }
              if (ele_group.id == '11a59d35-0d2e-4017-a8ae-670143fbd949') {
                //自动化测试组
                is_auto_tester_group = true
              }
              if (ele_group.id == '76fc41b7-f696-4b77-a1be-3d2bf61487a0') {
                //项目占有组
                is_project_use_group = true
              }
            }
          });
        }
      })
      if (!is_adminstrator_group) {
        console.log("groups:" + groups.length)
        groups.forEach(ele => {
          if (ele.permissionlist) {
            ele.permissionlist.forEach(ele1 => {
              var find = false
              permissions.forEach(permi => {
                if (permi.PermissionId == ele1.PermissionId) {
                  find = true
                  return false
                }
              });
              if (!find) {
                var per = _.clone(ele1);
                permissions.push(per)
              }
            });
          }
        });

        var state = {
          config: {
            websocketUrl: (function () {
              var wsUrl = url.parse(options.websocketUrl, true)
              wsUrl.query.uip = req.ip
              return url.format(wsUrl)
            })()
          }
          , user: req.user
          , is_adminstrator: false
          , permissions_list: permissions
          , is_auto_tester_group: is_auto_tester_group
          , is_project_use_group: is_project_use_group
        }

        if (options.userProfileUrl) {
          state.config.userProfileUrl = (function () {
            return options.userProfileUrl
          })()
        }

        res.type('application/javascript')
        res.send('var GLOBAL_APPSTATE = ' + JSON.stringify(state))


      } else {
        // console.log("is_adminstrator_group:")
        dbapi.loadPermissionList().then(function (cursor) {
          return cursor.toArray()
        }).then(function (list) {

          var state = {
            config: {
              websocketUrl: (function () {
                var wsUrl = url.parse(options.websocketUrl, true)
                wsUrl.query.uip = req.ip
                return url.format(wsUrl)
              })()
            }
            , user: req.user
            , is_adminstrator: true
            , permissions_list: permissions
            , is_auto_tester_group: is_auto_tester_group
            , is_project_use_group: is_project_use_group
          }

          if (options.userProfileUrl) {
            state.config.userProfileUrl = (function () {
              return options.userProfileUrl
            })()
          }

          res.type('application/javascript')
          res.send('var GLOBAL_APPSTATE = ' + JSON.stringify(state))

        })
      }
    })


  })

  server.listen(options.port)
  log.info('Listening on port %d', options.port)
}
