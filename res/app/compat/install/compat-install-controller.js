module.exports = function CompatInstallCtrl(
  $scope
, $rootScope
, InstallService
) {
  $scope.accordionOpen = true
  $scope.installation = null
  $scope.selected_serials = []
  $scope.activityFound = true
  

  
  $scope.$on('installation', function(e, installation) {
    $scope.installation = installation.apply($scope)
  })

  $scope.$on('selected_serials', function(e, selected_serials) {
    $scope.selected_serials = selected_serials.apply($scope)
    console.log("got selected serials list : " + JSON.stringify($scope.selected_serials))
  })

  $scope.installUrl = function(url) {
    return InstallService.installUrl($scope.control, url)
  }

  $scope.installFile = function($files) {
    if ($files.length) {
      return InstallService.uploadFileNotInstall($files)
      .then(function(){
        console.log('installation manifest: ' + JSON.stringify($scope.installation.manifest))
      })
    }
  }
  
}
