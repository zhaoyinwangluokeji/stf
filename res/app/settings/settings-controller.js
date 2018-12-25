module.exports = function SettingsCtrl($scope, gettext) {

  $scope.settingTabs = [
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
      icon: 'fa-ban fa-fw',
      templateUrl: 'settings/datasyn/datasyn.pug'
    },
    {
      title: gettext('用户管理'),
      icon: 'fa fa-user',
      templateUrl: 'settings/users/users-tab.pug'
    },
    {
      title: gettext('设备组管理'),
      icon: 'fa fa-mobile',
      templateUrl: 'settings/devicegroups/devicegroups.pug'
    },
    {
      title: gettext('设备添加删除'),
      icon: 'fa fa-mobile',
      templateUrl: 'settings/devicemanager/devicemanager.pug'
    }
  ]
}
