var oboe = require('oboe')

module.exports = function DeviceGroupsController($scope, $http, NgTableParams) {
    $scope.device_groups = []
    $scope.devices = []
    $scope.filtered_device_groups = {}
    $scope.deviceGroupFilter = ""
    $scope.showUserGroup = true
    $scope.userGroupFilter = ""
    $scope.deviceFilter = ""
    $scope.switchShow = function () {
        $scope.showUserGroup = !$scope.showUserGroup
    }

    $scope.getAllGroups = function () {
        return new Promise(function (resolve, reject) {
            data = {}
            $http.post('/auth/api/v1/mock/get-all-device-groups', data)
                .success(function (response) {
                    $scope.device_groups = response.data
                //    console.log("success: " + JSON.stringify(response.data))
                    return resolve(response.data)
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.data)
                })
        });
    }
    $scope.getAllGroups().then(function () {
        return $scope.QueryDeviceGroup()
    })

    $scope.DeleteGroup = function (name) {
        var data = {
            name: name
        }
        return new Promise(function (resolve, reject) {
            $http.post('/auth/api/v1/mock/delete-device-group', data)
                .success(function (response) {
                //    console.log("success:" + JSON.stringify(response))
                    return resolve(response.data)
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.error)
                })
        });
    }

    $scope.addDeviceGroup = function (name) {
        return new Promise(function (resolve, reject) {
            data = {
                name: name
                , usergroups: []
                , devices: []
            }
            $http.post('/auth/api/v1/mock/add-device-group', data)
                .success(function (response) {
                    console.log("success!")
                    return resolve(response.data)
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.data)
                })
        })
    }

    $scope.ModifyGroup = function (name, new_name) {
        var data = {
            name: name,
            new_name: new_name
        }
        return new Promise(function (resolve, reject) {
            $http.post('/auth/api/v1/mock/modify-device-group', data)
                .success(function (response) {
                //    console.log("success:" + JSON.stringify(response))
                    return resolve(response.data)
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.error)
                })
        });
    }




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

    $scope.IsArray = Array.isArray || function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }

    $scope.IsBoolean = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Boolean]';
    }

    $scope.CurRow
    $scope.CurGroup
    $scope.CurGroupUsers
    $scope.RowClick = function (row) {
        //    row.checked = true
        if (row.selected == true) row.selected = false
        else row.selected = true
        $scope.CurRow = row

    }

    $scope.findDeviceGroupByName = function(name){
        var tmp = null
        $scope.filtered_device_groups.data.forEach(element => {
            if(element.name == name){
                tmp = element
            }
        })
        return tmp
    }

    $scope.SelectGroup = function (row) {
        $scope.tableParamsGroup.data.forEach(element => {
            element.selected = false
            if (element == row) {
                $scope.CurGroup = $scope.findDeviceGroupByName(element.name)
            }
        })
        row.selected = true
        $scope.QueryMessage()
    }

    $scope.getUserGroupsOfDeviceGroup = function (params) {
        var list = []
        if ($scope.CurGroup && $scope.CurGroup.usergroups) {
            $scope.CurGroup.usergroups.forEach(element => {
                var tmp = {
                    GroupName: element
                }
                list.push(tmp)
            });
        }
        return list
    }

    $scope.tableParamsCustom = new NgTableParams(
        { count: 5 },
        {
            counts: [5, 10, 15, 30, 50],
            getData: $scope.getUserGroupsOfDeviceGroup

        }
    );

    $scope.pagesCustomCount = Math.ceil($scope.tableParamsCustom.total() / $scope.tableParamsCustom.parameters().count)

    $scope.QueryMessage = function () {
        try {
            $scope.tableParamsCustom.reload()
        } catch (e) {
            console.log("[Error] $scope.tableParamsDate.reload()");
        }
        try {
            $scope.tableParamsCustomDevices.reload()
        } catch (e) {
            console.log("[Error] $scope.tableParamsCustomDevices.reload()");
        }
    };
    $scope.sel = 15
    $scope.sel2 = 15

    $scope.getParamsGroups = function (page, count, filter) {
        var tmpList = []
        total = 0
        if (filter == "") {
            tmpList = $scope.device_groups.slice(0)
            total = $scope.device_groups.length
        } else {
            $scope.device_groups.forEach(ele => {
                if (ele.name.toLowerCase().indexOf(filter.toLowerCase()) != -1) {
                    total += 1
                    tmpList.push(ele)
                }
            });
        }
        var startIndex = parseInt((page - 1) * count);
        var endIndex = startIndex + count
        var len = tmpList.length
        if (len < startIndex) {
            return { total: total, data: [] }
        } else if (len > endIndex) {
            return { total: total, data: tmpList.slice(startIndex, endIndex) }
        } else {
            return { total: total, data: tmpList.slice(startIndex) }
        }
    }

    $scope.QueryFilterDeviceGroup = function (params) {
        var filter = $scope.deviceGroupFilter
        var count = params.parameters().count
        var page = params.parameters().page
        console.log("count:" + count)
        console.log("page:" + page)
        console.log("Initializing group...")
        $scope.filtered_device_groups = $scope.getParamsGroups(page, count, filter)
        console.log("total filtered device groups:  " + $scope.filtered_device_groups.total)
        params.total($scope.filtered_device_groups.total)
        var returnList = []
            
        $scope.filtered_device_groups.data.forEach(ele => {
            if ($scope.CurGroup && ele.name == $scope.CurGroup.name) {
                // ele.selected = true
                console.log("cur group exists")
                $scope.CurGroup = $scope.findDeviceGroupByName(ele.name)
                console.log("cur group:" + JSON.stringify($scope.CurGroup))
                returnList.push({
                    name: ele.name,
                    selected: true
                })
            }else{
                returnList.push({
                    name: ele.name,
                    selected: false
                })
            }
        })
        $scope.pagesGroupCount = Math.ceil($scope.tableParamsGroup.total() / $scope.tableParamsGroup.parameters().count)
        console.log("returnList: " + JSON.stringify(returnList))
        return returnList

    }
    $scope.tableParamsGroup = new NgTableParams(
        { count: 5 },
        {
            counts: [5, 15, 30, 50],
            getData: $scope.QueryFilterDeviceGroup
        }
    );
    $scope.AddNewDeviceGroup = function () {
        var name = prompt("输入新的设备组名称", ""); //将输入的内容赋给变量 name ，   
        if (name) {
            return $scope.addDeviceGroup(name).then(function (data) {
                console.log("成功添加设备组: " + JSON.stringify(data))
                $scope.getAllGroups().then(function () {
                    return $scope.QueryDeviceGroup()
                })
            }).catch(function (err) {
                console.log("err:" + JSON.stringify(err))
            })
                .then(function () {
                    return $scope.getAllGroups().then(function () {
                        return $scope.QueryDeviceGroup()
                    })
                })
        }
    }

    $scope.refreshAll = function () {
        return $scope.getAllGroups().then(function () {
            return $scope.QueryDeviceGroup()
        }).then(function () {
            console.log("重新加载用户组。。。")
            return $scope.QueryMessage()
        })

    }

    $scope.QueryDeviceGroup = function () {
        try {
            $scope.tableParamsGroup.reload()
        } catch (e) {
            console.log("[Error] $scope.tableParamsDate.reload(): ");
        }

    }

    $scope.ModifyDeviceGroup = function () {
        if ($scope.CurGroup) {
            var name = prompt("修改为新的设备组", ""); //将输入的内容赋给变量 name ，   
            if (name) {
                return $scope.ModifyGroup($scope.CurGroup.name, name).then(function (data) {
                    console.log("修改设备组成功：" + JSON.stringify(data))
                    $scope.QueryDeviceGroup()
                }).catch(function (err) {
                    console.log("err:" + JSON.stringify(err))
                }).then(function () {
                    return $scope.getAllGroups().then(function () {
                        return $scope.QueryDeviceGroup()
                    })
                })
            }
        }
        else {
            alert('还没有选择设备组')
        }
    }
    $scope.DeleteDeviceGroup = function () {

        if ($scope.CurGroup) {
            return $scope.DeleteGroup($scope.CurGroup.name).then(function (data) {
                console.log(JSON.stringify(data))
                $scope.QueryDeviceGroup()
            }).catch(function (err) {
                console.log("err:" + JSON.stringify(err))
            }).then(function () {
                return $scope.getAllGroups().then(function () {
                    return $scope.QueryDeviceGroup()
                })
            })
        } else {
            alert("fail:当前用户组为空，请选择用户组！")
        }
    }

    $scope.AddUserToGroup = function (name, usergroups) {
        var data = {
            name: name,
            usergroups: usergroups
        }
        return new Promise(function (resolve, reject) {
            $http.post('/auth/api/v1/mock/add-user-group-to-device-group', data)
                .success(function (response) {
                //    console.log("success:" + JSON.stringify(response))
                    return resolve(response.data)
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.error)
                })
        });
    }

    $scope.AddUserGroupsToDeviceGroup = function () {
        if ($scope.CurGroup) {
            var list = []
            $scope.tableParamsUserGroups.data.forEach(element => {
                if (element.selected == true) {
                    delete element.selected;
                    list.push(element.GroupName)
                }
            })
            return $scope.AddUserToGroup($scope.CurGroup.name, list).then(function (data) {
                console.log(JSON.stringify(data))
                $scope.refreshAll()
            }).catch(function (err) {
                console.log("err:" + JSON.stringify(err))
            })
        } else {
            alert("fail:当前用户组为空，请选择用户组！")
        }
    }

    $scope.RemoveUserFromGroup = function (name, usergroups) {
        var data = {
            name: name,
            usergroups: usergroups
        }
        console.log("Posting Data: " + JSON.stringify(data))
        return new Promise(function (resolve, reject) {
            $http.post('/auth/api/v1/mock/remove-user-group-from-device-group', data)
                .success(function (response) {
                //    console.log("success:" + JSON.stringify(response))
                    return resolve(response.data)
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.error)
                })
        });
    }

    $scope.RemoveUserGroupsFromDeviceGroup = function () {
        if ($scope.CurGroup) {
            if ($scope.tableParamsCustom.data) {
                var list = []
                $scope.tableParamsCustom.data.forEach(element => {
                    if (element.selected == true) {
                        list.push(element.GroupName)
                    }
                })
                return $scope.RemoveUserFromGroup($scope.CurGroup.name, list).then(function (data) {
                    console.log(JSON.stringify(data))
                    $scope.refreshAll()
                }).catch(function (err) {
                    console.log("err:" + JSON.stringify(err))
                })
            }
        } else {
            alert("fail:当前用户组为空，请选择用户组！")
        }
    }

    $scope.GetUserGroups = function (page, count, filter) {
        var data = {
            page: page
            , count: count
            , filter: filter
        }
        return new Promise(function (resolve, reject) {
            $http.post('/auth/api/v1/mock/getGroup', data)
                .success(function (response) {
                    console.log("success")
                    return resolve(response.data)
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.data)
                })

        });
    }


    $scope.QueryUserGroups = function (params) {
        var filter = $scope.userGroupFilter
        var count = params.parameters().count
        var page = params.parameters().page
        console.log("count:" + count)
        console.log("page:" + page)
        return $scope.GetUserGroups(page, count, filter).then(function (data) {
            var ret = data
            params.total(ret.total)
            console.log("all page count:" + ret.total)
            console.log("recv count:" + ret.datasets.length)
            $scope.pagesUserCount = Math.ceil($scope.tableParamsUserGroups.total() / $scope.tableParamsUserGroups.parameters().count)
            return ret.datasets
        }).catch(function (err) {
            console.log("err:" + JSON.stringify(err))
        })
    }

    $scope.tableParamsUserGroups = new NgTableParams(
        { count: 5 },
        {
            counts: [5, 10, 15, 30, 50],
            getData: $scope.QueryUserGroups
        }
    )
    $scope.SelectUser = function (row) {
        if (row.selected == true) row.selected = false
        else row.selected = true
    }
    $scope.FreshUser = function () {
        try {
            $scope.tableParamsUserGroups.reload()
        } catch (e) {
            console.log("[Error] $scope.tableParamsUsergroups.reload()");
        }
    }

    // 设备组设备管理

    $scope.getFilteredDevices = function (page, count, filter) {
        var data = {
            page: page
            , count: count
            , filter: filter
        }
        return new Promise(function (resolve, reject) {
            $http.post('/auth/api/v1/mock/get-filtered-devices', data)
                .success(function (response) {
                    console.log("success")
                    return resolve(response.data)
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.data)
                })

        });
    }

    $scope.QueryDevices = function (params) {
        var filter = $scope.deviceFilter
        console.log("device filter:" + $scope.deviceFilter)
        var count = params.parameters().count
        var page = params.parameters().page
        console.log("count:" + count)
        console.log("page:" + page)
        return $scope.getFilteredDevices(page, count, filter).then(function (data) {
            var ret = data
            params.total(ret.total)
            console.log("all page count:" + ret.total)
            console.log("recv count:" + ret.datasets.length)
            $scope.pagesDeviceCount = Math.ceil($scope.tableParamsDevices.total() / $scope.tableParamsDevices.parameters().count)
            return ret.datasets
        }).catch(function (err) {
            console.log("err:" + JSON.stringify(err))
        })
    }

    $scope.tableParamsDevices = new NgTableParams(
        { count: 5 },
        {
            counts: [5, 10, 15, 30, 50],
            getData: $scope.QueryDevices
        }
    )

    $scope.FreshDevice = function () {
        try {
            $scope.tableParamsDevices.reload()
        } catch (e) {
            console.log("[Error] $scope.tableParamsUsergroups.reload()");
        }
    }

    $scope.AddDevicesToGroup = function (name, devices) {
        var data = {
            name: name,
            devices: devices
        }
        return new Promise(function (resolve, reject) {
            $http.post('/auth/api/v1/mock/add-devices-to-device-group', data)
                .success(function (response) {
                //    console.log("success:" + JSON.stringify(response))
                    return resolve(response.data)
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.error)
                })
        });
    }

    $scope.AddDevicesToDeviceGroup = function () {
        if ($scope.CurGroup) {
            var list = []
            $scope.tableParamsDevices.data.forEach(element => {
                if (element.selected == true) {
                    delete element.selected;
                    list.push(element.serial)
                }
            })
            return $scope.AddDevicesToGroup($scope.CurGroup.name, list).then(function (data) {
                console.log(JSON.stringify(data))
                $scope.refreshAll()
            }).catch(function (err) {
                console.log("err:" + JSON.stringify(err))
            })
        } else {
            alert("fail:当前用户组为空，请选择用户组！")
        }
    }

    $scope.RemoveDevicesFromGroup = function (name, devices) {
        console.log("Group Name:  " + name)
        console.log("List:  " + JSON.stringify(devices))
        var data = {
            name: name,
            devices: devices
        }
        console.log("Posting Data: " + JSON.stringify(data))
        return new Promise(function (resolve, reject) {
            $http.post('/auth/api/v1/mock/remove-devices-from-device-group', data)
                .success(function (response) {
                //    console.log("success:" + JSON.stringify(response))
                    return resolve(response.data)
                })
                .error(function (response) {
                    console.log("fail")
                    return reject(response.error)
                })
        });
    }

    $scope.RemoveDevicesFromDeviceGroup = function () {
        if ($scope.CurGroup) {
            if ($scope.tableParamsCustomDevices.data) {
                var list = []
                $scope.tableParamsCustomDevices.data.forEach(element => {
                    if (element.selected == true) {
                        list.push(element.serial)
                    }
                })
                return $scope.RemoveDevicesFromGroup($scope.CurGroup.name, list).then(function (data) {
                    console.log(JSON.stringify(data))
                    $scope.refreshAll()
                }).catch(function (err) {
                    console.log("err:" + JSON.stringify(err))
                })
            }
        } else {
            alert("fail:当前用户组为空，请选择用户组！")
        }
    }

    $scope.getDevicesOfDeviceGroup = function (params) {
        var list = []
        if ($scope.CurGroup && $scope.CurGroup.devices) {
            $scope.CurGroup.devices.forEach(element => {
                var tmp = {
                    serial: element
                }
                list.push(tmp)
            });
        }
        return list
    }

    $scope.tableParamsCustomDevices = new NgTableParams(
        { count: 5 },
        {
            counts: [5, 10, 15, 30, 50],
            getData: $scope.getDevicesOfDeviceGroup

        }
    );

}
