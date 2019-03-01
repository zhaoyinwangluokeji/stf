
module.exports = function UsersInfoDirective(
  gettext,
  NgTableParams,
  UsersGroupService,
  UsersService,
  PermissionService,
  AppState
) {
  //
  return {
    restrict: 'E'
    , template: require('./users-group.pug')
    , scope: {
      //      tracker: '&tracker'
      //    , columns: '&columns'
      //    , sort: '=sort'
      //    , filter: '&filter'
    }
    , link: function ($scope, element) {

      $scope.synenable = true
      $scope.vm = {
        value: 0,
        style: 'progress-bar-info',
        showLabel: true,
        striped: true
      }
      $scope.queryFilter = ""
      $scope.func = function () {
        $scope.synenable = false
        var total = 0
      }
      $scope.check = function (row) {
        $scope.CurRow = row
      }

      $scope.activeTabs = {
        users: true,
        permission: false,
        filterGroupUserslist: ""
      }

      $scope.IsArray = Array.isArray || function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
      }

      $scope.IsBoolean = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Boolean]';
      }


      $scope.simpleList = [
        { "id": 1, "name": "Nissim", "age": 41, "money": 454 },
        { "id": 2, "name": "Mariko", "age": 10, "money": -100 },
        { "id": 3, "name": "Mark", "age": 39, "money": 291 },
        { "id": 4, "name": "Allen", "age": 85, "money": 871 },
        { "id": 5, "name": "Dustin", "age": 10, "money": 378 },
        { "id": 6, "name": "Macon", "age": 9, "money": 128 },
        { "id": 7, "name": "Ezra", "age": 78, "money": 11 },
        { "id": 8, "name": "Fiona", "age": 87, "money": 285 },
        { "id": 9, "name": "Ira", "age": 7, "money": 816 },
        { "id": 10, "name": "Barbara", "age": 46, "money": 44 },
        { "id": 11, "name": "Lydia", "age": 56, "money": 494 },
        { "id": 12, "name": "Carlos", "age": 80, "money": 193 }
      ];
      $scope.CurRow
      $scope.CurGroup
      $scope.CurGroupUsers
      $scope.RowClick = function (row) {
        //    row.checked = true
        if (row.selected == true) row.selected = false
        else row.selected = true
        $scope.CurRow = row

      }

      $scope.SelectGroup = function (row) {
        $scope.tableParamsGroup.data.forEach(element => {
          element.selected = false
          if (element == row) {
            $scope.CurGroup = element
          }
        })
        row.selected = true
        if ($scope.activeTabs.users) {
          $scope.QueryUsersOfGroup()
        } else {
          $scope.QueryPermissionOfGroup()
        }

      }

      $scope.ResetPassword = function () {
        if (!$scope.CurRow) {
          alert('没有选择用户')
        } else {
          var email = $scope.CurRow.email
          var name = $scope.CurRow.name
          return UsersService.ResetUserPassword(email, name).then(function (data) {
            alert(data.msg)
          }).catch(function (err) {
            console.log("err:" + JSON.stringify(err))
          })
        }
      }
      $scope.ModifyPassword = function () {
        if (!$scope.CurRow) {
          alert(gettext('没有选择用户!'))
        } else {
          var password = prompt(gettext("请输入新的密码"), ""); //将输入的内容赋给变量 name ，
          if (password)//如果返回的有内容
          {
            var email = $scope.CurRow.email
            var name = $scope.CurRow.name
            return UsersService.ModifyPassword($scope.CurRow, password).then(function (data) {
              alert(data.msg)
            }).catch(function (err) {
              console.log("err:" + JSON.stringify(err))
            })
          }
        }
      }

      $scope.filterGroupUserslist = ""

      $scope.Query3 = function (params) {
        if ($scope.CurGroup && $scope.CurGroup.userslist) {
          var count = params.parameters().count
          var page = params.parameters().page
          console.log("count:" + count)
          console.log("page:" + page)
          var filter = $scope.activeTabs.filterGroupUserslist
          console.log("filter:" + filter)
          var userslist = []
          if (!filter || filter == "") {
            userslist = $scope.CurGroup.userslist
          } else {
            $scope.CurGroup.userslist.forEach(element => {
              if (element["email"].indexOf(filter) != -1 ||
                element["NameCN"].indexOf(filter) != -1 ||
                element["name"].indexOf(filter) != -1) {
                userslist.push(element)
              }

            });
          }
          params.total(userslist.length)
          $scope.pagesCustomCount = Math.ceil($scope.tableParamsUsersOfGroup.total() / $scope.tableParamsUsersOfGroup.parameters().count)

          return userslist.slice((page - 1) * count, page * count)

        } else {
          return []
        }
      }

      $scope.tableParamsUsersOfGroup = new NgTableParams(
        { count: 10 },
        {
          counts: [10, 15, 30, 50],
          getData: $scope.Query3

        }
      );

      $scope.FreshGroupUsersList = function () {
        try {
          $scope.tableParamsUsersOfGroup.reload()

        } catch (e) {
          console.log("[Error] $scope.tableParamsUser.reload()");
        }
      }

      $scope.pagesCustomCount = Math.ceil($scope.tableParamsUsersOfGroup.total() / $scope.tableParamsUsersOfGroup.parameters().count)

      $scope.QueryUsersOfGroup = function () {
        try {
          $scope.tableParamsUsersOfGroup.reload()
          $scope.tableParamsUsersOfGroup.page(1)
        } catch (e) {
          console.log("[Error] $scope.tableParamsDate.reload()");
        }
      };

      $scope.QueryPermission = function (params) {
        if ($scope.CurGroup && $scope.CurGroup.permissionlist) {
          return $scope.CurGroup.permissionlist
        } else {
          return []
        }
      }

      $scope.tableParamsPermissionOfGroup = new NgTableParams(
        { count: 5 },
        {
          counts: [5, 10, 15, 30, 50],
          getData: $scope.QueryPermission

        }
      );


      $scope.QueryPermissionOfGroup = function () {
        try {
          $scope.tableParamsPermissionOfGroup.reload()
        } catch (e) {
          console.log("[Error] $scope.tableParamsDate.reload()");
        }
      };



      $scope.sel = 15
      $scope.sel2 = 15
      $scope.Query2 = function (params) {
        var filter = $scope.filterGroup
        var count = params.parameters().count
        var page = params.parameters().page
        console.log("count:" + count)
        console.log("page:" + page)
        return UsersGroupService.GetGroups(page, count, filter).then(function (data) {
          var ret = data
          params.total(ret.total)
          console.log("all page count:" + ret.total)
          console.log("recv count:" + ret.datasets.length)
          if ($scope.CurGroup) {
            console.log("cur group exists")
            ret.datasets.forEach(ele => {
              if (ele.GroupName == $scope.CurGroup.GroupName) {
                ele.selected = true
                $scope.CurGroup = ele
                if ($scope.activeTabs.users) {
                  $scope.QueryUsersOfGroup()
                } else {
                  $scope.QueryPermissionOfGroup()
                }
              }
            })
          }
          $scope.pagesGroupCount = Math.ceil($scope.tableParamsGroup.total() / $scope.tableParamsGroup.parameters().count)
          return ret.datasets
        }).catch(function (err) {
          console.log("err:" + JSON.stringify(err))
        })
      }
      $scope.tableParamsGroup = new NgTableParams(
        { count: 15 },
        {
          counts: [10, 15, 30, 50],
          getData: $scope.Query2
        }
      );
      $scope.pagesGroupCount = Math.ceil($scope.tableParamsGroup.total() / $scope.tableParamsGroup.parameters().count)

      $scope.AddNewGroup = function () {
        var group = prompt("输入新的用户组", ""); //将输入的内容赋给变量 name ，
        if (group) {
          return UsersGroupService.NewGroups(group).then(function (data) {
            alert(JSON.stringify(data))
            $scope.QueryGroup()
          }).catch(function (err) {
            console.log("err:" + JSON.stringify(err))
          })
        }
      }

      $scope.filterGroup = ""
      $scope.QueryGroup = function () {
        try {
          $scope.tableParamsGroup.reload()
        } catch (e) {
          console.log("[Error] $scope.tableParamsDate.reload()");
        }
      }
  // 'tester'
  // 'developer'
  // '自动化测试组'
  // '项目占用组'

      $scope.ModifyGroup = function () {
        if ($scope.CurGroup) {
          if ($scope.CurGroup.GroupName == "administrator") {
            alert(gettext("wranning:adminstrator usergroup cann't modify!"))
          } else if ($scope.CurGroup.GroupName == "tester") {
            alert(gettext("wranning:tester usergroup cann't modify!"))
          } else if ($scope.CurGroup.GroupName == "developer") {
            alert(gettext("wranning:developer usergroup cann't modify!"))
          } else if ($scope.CurGroup.GroupName == "自动化测试组") {
            alert(gettext("wranning:自动化测试组 usergroup cann't modify!"))
          } else if ($scope.CurGroup.GroupName == "项目占用组") {
            alert(gettext("wranning:项目占用组 usergroup cann't modify!"))
          }else {
            var group = prompt("修改为新的用户组", ""); //将输入的内容赋给变量 name ，
            if (group) {
              return UsersGroupService.ModifyGroup($scope.CurGroup.GroupName, group).then(function (data) {
                alert(JSON.stringify(data))
                $scope.QueryGroup()
              }).catch(function (err) {
                console.log("err:" + JSON.stringify(err))
              })
            }
          }

        }
        else {
          alert('还没有选择用户组')
        }
      }
      $scope.DeleteGroup = function () {

        if ($scope.CurGroup) {
          if ($scope.CurGroup.GroupName == "administrator") {
            alert(gettext("warnning:adminstrator usergroup cann't delete!"))
          } else if ($scope.CurGroup.GroupName == "tester") {
            alert(gettext("wranning:tester usergroup cann't delete!"))
          } else if ($scope.CurGroup.GroupName == "developer") {
            alert(gettext("wranning:developer usergroup cann't delete!"))
          } else if ($scope.CurGroup.GroupName == "自动化测试组") {
            alert(gettext("wranning:自动化测试组 usergroup cann't delete!"))
          } else if ($scope.CurGroup.GroupName == "项目占用组") {
            alert(gettext("wranning:项目占用组 usergroup cann't delete!"))
          }
           else {
            return UsersGroupService.DeleteGroup($scope.CurGroup.GroupName).then(function (data) {
              alert(JSON.stringify(data))
              $scope.QueryGroup()
            }).catch(function (err) {
              console.log("err:" + JSON.stringify(err))
            })
          }
        } else {
          alert("fail:当前用户组为空，请选择用户组！")
        }
      }

      $scope.AddUserToGroup = function () {

        if ($scope.CurGroup) {
          var list = []
          var isselected_admin = false
          $scope.tableParamsUser.data.forEach(element => {
            if (element.selected == true && element.name != "admin") {
              delete element.selected;
              list.push(element)
            }
            if (element.selected == true && element.name == "admin") {
              isselected_admin = true
            }
          })
          if (list.length == 0 && isselected_admin == true) {
            alert("warning:can not add user:admin to any group!")
            return
          }
          return UsersGroupService.AddUserToGroup($scope.CurGroup.GroupName, list).then(function (data) {
            alert(JSON.stringify(data))
            $scope.QueryGroup()
          }).catch(function (err) {
            console.log("err:" + JSON.stringify(err))
          })
        } else {
          alert("fail:当前用户组为空，请选择用户组！")
        }
      }


      $scope.RemoveUserOfGroup = function () {
        if ($scope.CurGroup) {
          if ($scope.CurGroup.userslist) {
            var list = []
            if ($scope.CurGroup.GroupName == "administrator") {
              var badmin = false
              $scope.CurGroup.userslist.forEach(element => {
                if (element.selected == true && element.name != "admin") {
                  list.push(element)
                  if (element.name == "admin") {
                    badmin = true
                  }
                }
                if (element.selected == true && element.name == "admin") {
                  badmin = true
                }
              })
              if (list.length == 0 && badmin == true) {
                alert("cann't remove user:admin!")
                return
              }

            } else {
              $scope.CurGroup.userslist.forEach(element => {
                if (element.selected == true) {
                  list.push(element)
                }
              })
            }
            if (list.length == 0) {
              alert("warnning:there is no selected user!")
              return

            } else {
              return UsersGroupService.RemoveUserOfGroup($scope.CurGroup.GroupName, list).then(function (data) {
                alert(JSON.stringify(data))
                $scope.QueryGroup()
              }).catch(function (err) {
                console.log("err:" + JSON.stringify(err))
              })
            }

          }
        } else {
          alert("fail:当前用户组为空，请选择用户组！")
        }
      }

      $scope.filterUser = ""
      $scope.QueryUser = function (params) {
        var filter = $scope.filterUser
        var count = params.parameters().count
        var page = params.parameters().page
        console.log("count:" + count)
        console.log("page:" + page)
        console.log("filter:" + filter)
        return UsersService.GetUsers(page, count, filter).then(function (data) {
          var ret = data
          params.total(ret.total)
          console.log("all page count:" + ret.total)
          console.log("recv count:" + ret.datasets.length)
          $scope.pagesUserCount = Math.ceil($scope.tableParamsUser.total() / $scope.tableParamsUser.parameters().count)
          return ret.datasets
        }).catch(function (err) {
          console.log("err:" + JSON.stringify(err))
        })
      }

      $scope.tableParamsUser = new NgTableParams(
        { count: 15 },
        {
          counts: [10, 15, 30, 50],
          getData: $scope.QueryUser
        }
      )
      $scope.pagesUserCount = 0
      $scope.SelectRow = function (row) {
        if (row.selected == true) row.selected = false
        else row.selected = true
      }
      $scope.FreshUser = function () {
        try {
          $scope.tableParamsUser.reload()
        } catch (e) {
          console.log("[Error] $scope.tableParamsUser.reload()");
        }
      }


      $scope.AddPermissiionToGroup = function () {
        if ($scope.CurGroup) {
          var list = []
          var isselected_admin = false

          if ($scope.CurGroup.GroupName == "administrator") {
            alert("warnning: there is not need to add any permission to administrator")
            return
          } else {
            $scope.tableParamsPermission.data.forEach(element => {
              if (element.selected == true) {
                delete element.selected;
                list.push(element)
              }
            })
            return PermissionService.AddPermissionToGroup($scope.CurGroup.GroupName, list).then(function (data) {
              alert(JSON.stringify(data))
              $scope.QueryGroup()
            }).catch(function (err) {
              console.log("err:" + JSON.stringify(err))
            })
          }

        } else {
          alert("fail:当前用户组为空，请选择用户组！")
        }
      }

      $scope.RemovePermissionOfGroup = function () {
        if ($scope.CurGroup) {
          if ($scope.CurGroup.permissionlist) {
            var list = []
            if ($scope.CurGroup.GroupName != "administrator") {
              $scope.CurGroup.permissionlist.forEach(element => {
                if (element.selected == true) {
                  list.push(element)
                }
              })
            }
            if (list.length == 0) {
              alert("warnning:there is no selected permission!")
              return
            } else {
              return PermissionService.RemovePermissionOfGroup($scope.CurGroup.GroupName, list).then(function (data) {
                alert(JSON.stringify(data))
                $scope.QueryGroup()
              }).catch(function (err) {
                console.log("err:" + JSON.stringify(err))
              })
            }

          }
        } else {
          alert("fail:当前用户组为空，请选择用户组！")
        }
      }
      $scope.filterPermission = ""
      $scope.QueryAllPermission = function (params) {
        var filter = $scope.filterPermission
        var count = params.parameters().count
        var page = params.parameters().page
        console.log("count:" + count)
        console.log("page:" + page)
        console.log("filter:" + filter)
        return PermissionService.GetAllPermission(page, count, filter).then(function (data) {
          var ret = data
          params.total(ret.total)
          console.log("all page count:" + ret.total)
          console.log("recv count:" + ret.datasets.length)
          $scope.pagesUserCount = Math.ceil($scope.tableParamsPermission.total() / $scope.tableParamsPermission.parameters().count)
          return ret.datasets
        }).catch(function (err) {
          console.log("err:" + JSON.stringify(err))
        })
      }

      $scope.tableParamsPermission = new NgTableParams(
        { count: 15 },
        {
          counts: [10, 15, 30, 50],
          getData: $scope.QueryAllPermission
        }
      )

      $scope.FreshAllPermission = function () {
        try {
          $scope.tableParamsPermission.reload()
        } catch (e) {
          console.log("[Error] $scope.tableParamsPermission.reload()");
        }
      }

    }
  }
}
