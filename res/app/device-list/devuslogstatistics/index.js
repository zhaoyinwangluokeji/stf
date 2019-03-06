require('./dev-using-statistics.css')


require('script!ng-table/dist/ng-table')

module.exports = angular.module('stf.dev-using-statistics', [
    require('gettext').name,
    require('stf/user/group').name,
    require('stf/common-ui').name,
    require('../column').name,
    require('../empty').name,
    require('stf/standalone').name,
    require('stf/app-state').name,
    'ngRoute',
    'ngTable'
]).directive('devUsingStatistics', require('./dev-using-statistics'))
    .controller('DevUsingStatisticsController', require('./dev-using-statistics-controller'))
