var oboe = require('oboe')
module.exports = function ProjectSynController($scope, ProjectSynService, AppState) {

    $scope.synenable = true

    $scope.vm = {
        value: 0,
        style: 'progress-bar-info',
        showLabel: true,
        striped: true
    }

    $scope.synProjects = function () {
        $scope.synenable = false
        var total = 0
        ProjectSynService.ProjectSyn().then(
            function (ret) {
                if (ret.success == true) {
                    var timeout_ms = 2000; // 2 seconds
                    var interval = setInterval(function () {
                        console.log("timed out!");
                        var user = AppState.user.name

                        oboe('/api/v1/projects/getProjectSynBar?user=' + user)
                            .done(function (res) {
                                console.log("ProjectSyn Process:" + JSON.stringify(res))
                                if (res && res.success && res.success == true) {
                                    clearInterval(interval)
                                } else {
                                    if (res.data.fail && res.data.fail == true) {
                                        clearInterval(interval)
                                    } else {
                                        $scope.vm.value = (res.data.curIndex / res.data.total) * 100;
                                        if ($scope.vm.value == 100) {
                                            clearInterval(interval)
                                            alert("同步完成")
                                        }
                                    }
                                }
                            })
                            .fail(function (error) {
                                console.log(error);
                                clearInterval(interval);
                                //   reject({ success: false, info: error });
                            });

                    }, timeout_ms);


                } else {
                    alert("同步失败：" + JSON.stringify(ret.info))
                }
            }
        )

    }

    $scope.synUsers = function () {
        $scope.synenable = false
        var total = 0
        ProjectSynService.ProjectSyn().then(
            function (ret) {
                if (ret.success == true) {
                    var timeout_ms = 2000; // 2 seconds
                    var interval = setInterval(function () {
                        console.log("timed out!");
                        var user = AppState.user.name

                        oboe('/api/v1/projects/getProjectSynBar?user=' + user)
                            .done(function (res) {
                                console.log("ProjectSyn Process:" + JSON.stringify(res))
                                if (res && res.success && res.success == true) {
                                    clearInterval(interval);
                                } else {
                                    if (res.data.fail && res.data.fail == true) {
                                        clearInterval(interval);
                                    } else {
                                        $scope.vm.value = (res.data.curIndex / res.data.total) * 100;
                                        if ($scope.vm.value == 100) {
                                            clearInterval(interval);
                                            alert("同步完成")
                                        }
                                    }
                                }
                            })
                            .fail(function (error) {
                                console.log(error);
                                clearInterval(interval);
                                //   reject({ success: false, info: error });
                            });

                    }, timeout_ms);


                } else {
                    alert("同步失败：" + JSON.stringify(ret.info))
                }
            }
        )

    }

}
