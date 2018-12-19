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
      title: gettext('DataSynchron'),
      icon: 'fa-ban fa-fw',
      templateUrl: 'settings/projectsyn/projectsyn.pug'
    },
    {
      title: gettext('Users'),
      icon: 'fa fa-user',
      templateUrl: 'settings/users/users-tab.pug'
    },
    {
      title: gettext('DeviceGroups'),
      icon: 'fa fa-mobile',
      templateUrl: 'settings/devicegroups/devicegroups.pug'
    }
  ]
}
