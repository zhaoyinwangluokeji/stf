require('./datasyn.css')
//require('nine-bootstrap')

module.exports = angular.module('stf.settings.projectsyn', [
    require('stf/app-state').name
  ])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put(
      'settings/datasyn/datasyn.pug', require('./datasyn.pug')
    )
  }])
   .controller('DataSynController', require('./datasyn'))
   .service('ProjectSynService', require('./ProjectSynService'))
   .service('UsersSynService', require('./UsersSynService'))
   