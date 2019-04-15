var serveStatic = require('serve-static')

var pathutil = require('../../../util/pathutil')

module.exports = function() {
  return serveStatic(
    pathutil.root('res/app/components/mobile-images')
  , {
      maxAge: '30d'
    }
  )
}
