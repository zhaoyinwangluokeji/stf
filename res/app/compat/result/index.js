require('./compat-result.css')

require('ng-file-upload')

module.exports = angular.module('stf.compat-result', [
  'angularFileUpload',
  require('stf/settings').name,
  require('stf/user/group').name,
  require('stf/storage').name,
  require('stf/install').name,
  require('stf/upload').name,
  require('stf/app-state').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('compat/result/compat-result.pug',
      require('./compat-result.pug')
    )
  }])
  .controller('CompatResultCtrl', require('./compat-result-controller'))
