var jwtutil = require('../../../util/jwtutil')
var urlutil = require('../../../util/urlutil')

var dbapi = require('../../../db/api')
var crypto = require('crypto')
var CircularJSON = require('circular-json')

module.exports = function (options) {
  return function (req, res, next) {
    if(req.header('User-Agent').indexOf('Chrome') == -1){
      res.status(403)
              .json({
                success: false
                , error: '非指定浏览器'
                , data: {
                  message: "请使用Chrome访问STF。"
                }
              })
    }
    if (req.query.jwt) {
      // Coming from auth client
      var data = jwtutil.decode(req.query.jwt, options.secret)
      var redir = urlutil.removeParam(req.url, 'jwt')
      if (data) {

        var user
        var password
        var user1 = {
          name: data.name,
          email: data.email
        }
        dbapi.loadUserFromUser(user1).then(function (list) {
          return list.toArray()
        }).then(function (result) {
          //  console.log("result user:" + JSON.stringify(result))
          if (result == null || result.length == 0) {
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
            user = result[0]
            dbapi.loadPasswordFromUser(user)
              .then(function (cursor) {
                return cursor.toArray()
              })
              .then(function (datas) {
                if (datas.length == 0) {
                  console.log("resultpassword=null")
                  var content = user.name  //加密的明文；
                  var md5 = crypto.createHash('md5')//定义加密方式:md5不可逆,此处的md5可以换成任意hash加密的方法名称；
                  md5.update(content);
                  password = md5.digest('hex')  //加密后的值d

                } else {
                  console.log("result.password")
                  password = datas[0].password
                }
                console.log("加密的结果password0：" + password)
                var md5 = crypto.createHash('md5')
                md5.update(data.password)
                var password_register = md5.digest('hex')
                console.log("加密的结果password1：" + password_register)

                if (password_register == password) {
                  req.session.jwt = data
                  res.redirect(redir)
                } else {
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
        // Redirect once to get rid of the token
      }
      else {
        // Invalid token, forward to auth client
        res.redirect(options.authUrl)
      }
    }
    else if (req.session && req.session.jwt) {
      dbapi.loadUser(req.session.jwt.email)
        .then(function (user) {
          if (user) {
            // Continue existing session
            req.user = user
            next()
          }
          else {
            // We no longer have the user in the database
            res.redirect(options.authUrl)
          }
        })
        .catch(next)
    }
    else {
      // No session, forward to auth client
      res.redirect(options.authUrl)
    }
  }
}
