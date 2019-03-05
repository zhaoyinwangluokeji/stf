require('./compat-report.css')

module.exports = angular.module('stf.compat-report', [
  require('stf/settings').name,
  require('stf/user/group').name,
  require('stf/storage').name,
  require('stf/install').name,
  require('stf/upload').name,
  require('stf/app-state').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('compat/report/compat-report.pug',
      require('./compat-report.pug')
    )
  }])
  .controller('CompatReportCtrl', require('./compat-report-controller'))
