var dbapi = require('../db/api')




module.exports.getpermission = function (user) {
  return dbapi.loadAllUserGroups().then(function (cursor) {
    return cursor.toArray()
  }).then(function (list) {
    console.log("getpermission")
    var groups = []
    var is_adminstrator_group = false
    var is_auto_tester_group = false
    var is_project_use_group = false
    var permissions = []
    list.forEach(ele_group => {
      if (ele_group.userslist) {
        ele_group.userslist.forEach(ele_user => {
          if (ele_user.name == user.name && ele_user.email == user.email) {
            groups.push(ele_group)
            if (ele_group.GroupName == "administrator") {
              is_adminstrator_group = true
            }
            if (ele_group.id == '11a59d35-0d2e-4017-a8ae-670143fbd949') {
              //自动化测试组
              is_auto_tester_group = true
            }
            if (ele_group.id == '76fc41b7-f696-4b77-a1be-3d2bf61487a0') {
              //项目占有组
              is_project_use_group = true
            }
          }
        });
      }
    })
    return dbapi.loadPermissionList().then(function (cursor) {
      return cursor.toArray()
    }).then(function (permissionlistAll) {
      console.log("permissionlistAll:" + JSON.stringify(permissionlistAll))
      if (!is_adminstrator_group) {
        groups.forEach(ele => {
          if (ele.permissionlist) {
            ele.permissionlist.forEach(ele1 => {
              var find = false
              permissions.forEach(permi => {
                if (permi.PermissionId == ele1.PermissionId) {
                  find = true
                  return false
                }
              });
              if (!find) {
                var per = _.clone(ele1);
                permissions.push(per)
              }
            });
          }
        });
        console.log("re1")
        return {
          is_adminstrator: false
          , permissions_list: permissions
          , is_auto_tester_group: is_auto_tester_group
          , is_project_use_group: is_project_use_group
        }
      } else {
        console.log("re2")
        return {
          is_adminstrator: true
          , permissions_list: permissionlistAll
          , is_auto_tester_group: is_auto_tester_group
          , is_project_use_group: is_project_use_group
        }
      }
    })
  })
}




