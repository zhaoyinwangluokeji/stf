require('./dev-using-statistics.css')


require('script!ng-table/dist/ng-table')

module.exports = angular.module('stf.dev-using-statistics', [
    require('gettext').name,
    'ngTable'
]).directive('devUsingStatistics', require('./dev-using-statistics'))
    .controller('DevUsingStatisticsController', require('./dev-using-statistics-controller'))
