var patchArray = require('./../util/patch-array')

module.exports = function DeviceListDetailsDirective(
   
) {
    return {
        restrict: 'E'
        , template: require('./dev-using-statistics.pug')
        , scope: {
        }
        , link: function (scope, element) {
            var activeColumns = []
            var activeSorting = []
            var activeFilters = []
            var table = element.find('table')[0]
            var tbody = table.createTBody()
            var rows = tbody.rows
            var prefix = 'd' + Math.floor(Math.random() * 1000000) + '-'
            var mapping = Object.create(null)
            var childScopes = Object.create(null)
            
        }
    }
}
