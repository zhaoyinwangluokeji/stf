
require('./announce.css')
module.exports = angular.module('stf.announcement', [
  'ngTable'
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/dashboard/announcement/announcement.pug',
      require('./announcement.pug')
    )
  }])
  .controller('AnnounceControl', require('./announce-controller'))
