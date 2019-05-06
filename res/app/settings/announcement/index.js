
module.exports = angular.module('stf.settings.announcement', [
  require('stf/app-state').name,
  require('ui-bootstrap').name,
  require('angular-xeditable').name,
  'ngTable'
])
.run(['$templateCache', function($templateCache) {
  $templateCache.put(
    'settings/announcement/announcement.pug', require('./announcement.pug')
  )
}])
 .controller('AnnounceController', require('./announce-controller'))

