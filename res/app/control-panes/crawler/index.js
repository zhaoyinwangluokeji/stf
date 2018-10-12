require('./crawler.css')


module.exports = angular.module('stf.crawler', [
  require('stf/angular-packery').name,
  require('stf/common-ui/modals/lightbox-image').name
])
  .run(['$templateCache', function($templateCache) {
    $templateCache.put('control-panes/crawler/crawler.pug',
      require('./crawler.pug')
    )
  }])
  .controller('CrawlerCtrl', require('./crawler-controller'))
  
