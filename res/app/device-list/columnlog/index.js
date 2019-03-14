module.exports = angular.module('stf.device-list.log-columnl', [
    require('gettext').name
  ])
    .service('LogColumnService', require('./log-column-service'))
  