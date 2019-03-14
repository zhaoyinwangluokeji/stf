module.exports = function SettingsCtrl($scope, gettext, PermissionService) {
  $scope.settingTabs = []

  var Init = function () {
    var settings = [
      {
        title: gettext('General'),
        icon: 'fa-gears fa-fw',
        templateUrl: 'settings/general/general.pug'
      },
      {
        title: gettext('Keys'),
        icon: 'fa-key fa-fw',
        templateUrl: 'settings/keys/keys.pug'
      },
      {
        title: gettext('数据同步'),
        icon: 'fa-cloud fa-fw',
        templateUrl: 'settings/datasyn/datasyn.pug',
        PermissionId: "335e7c9c-3819-4fd5-b989-65e0a682970e"
      },
      {
        title: gettext('用户管理'),
        icon: 'fa fa-user',
        templateUrl: 'settings/users/users-tab.pug',
        PermissionId: "551281ad-d3ed-41d5-a2d7-9a18bb891c6f"
      },
      {
        title: gettext('设备组管理'),
        icon: 'fa fa-mobile',
        templateUrl: 'settings/devicegroups/devicegroups.pug',
        PermissionId: "8e1d13b6-48f2-413c-aae1-03c244b11210"
      },
      {
        title: gettext('设备添加删除'),
        icon: 'fa fa-mobile',
        templateUrl: 'settings/devicemanager/devicemanager.pug',
        PermissionId: "88ca3d8d-d989-4a6e-be8d-dc8d358bfa99"
      }
    ]
    var array = []
    return PermissionService.getAllPermissionByUser().then(function (data) {
      var ret = data
      var permissions = ret.datasets
      console.log("permissions:" + JSON.stringify(permissions))
      settings.forEach(element => {
        if (!element.PermissionId) {
          array.push(element)
        } else {
          var find = false
          permissions.forEach(ele_permission => {
            if (element.PermissionId == ele_permission.PermissionId) {
              find = true
              return false
            }
          });
          if (find) {
            delete element.PermissionId
            array.push(element)
          }
        }
      });
      console.log("settings:" + JSON.stringify(array))
      $scope.settingTabs = array
      $scope.$digest()
      return resolve(array)

    }).catch(function (err) {
      console.log("SettingsCtrl:" + JSON.stringify(err))
    })
  }
  Init()
   

}
