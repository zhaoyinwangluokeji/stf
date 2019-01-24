module.exports = function InstallCtrl(
  $scope
, InstallService
) {
  $scope.accordionOpen = true
  $scope.installation = null
  $scope.selected_serials = []

  $scope.clear = function() {
    $scope.installation = null
    $scope.accordionOpen = false
  }

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
        console.log("installation href: " + JSON.stringify($scope.installation.href))
      })
    }
  }
}
