require('./projectsyn.css')
//require('nine-bootstrap')

module.exports = angular.module('stf.settings.projectsyn', [
    require('stf/app-state').name
  ])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/projectsyn/projectsyn.pug', require('./projectsyn.pug')
    )
  }])
   .controller('ProjectSynController', require('./projectsyn'))
   .service('ProjectSynService', require('./ProjectSynService'))