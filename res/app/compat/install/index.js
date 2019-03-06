require('./compat-install.css')

require('ng-file-upload')

module.exports = angular.module('stf.compat-install', [
  'angularFileUpload',
  require('stf/settings').name,
  require('stf/storage').name,
  require('stf/install').name,
  require('stf/upload').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('compat/install/compat-install.pug',
      require('./compat-install.pug')
    )
  }])
  .controller('CompatInstallCtrl', require('./compat-install-controller'))
