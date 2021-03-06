var oboe = require('oboe')
require('./dev-using-statistics.css')
var ExportJsonExcel = require('js-export-excel')

module.exports =
  function DevUsingStatisticsFactory($uibModal, $location, $route, $interval, socket, AppState, DeviceRentLogService
  ) {

    var DevUsingStatistics = {}
    Date.prototype.format = function (formatStr) {
      var str = formatStr;
      var Week = ['日', '一', '二', '三', '四', '五', '六'];
      str = str.replace(/yyyy|YYYY/, this.getFullYear());
      str = str.replace(/MM/, (this.getMonth() + 1) > 9 ? (this.getMonth() + 1).toString() : '0' + (this.getMonth() + 1));
      str = str.replace(/dd|DD/, this.getDate() > 9 ? this.getDate().toString() : '0' + this.getDate());
      return str;
    }


    DevUsingStatistics.DevUsingStatisticsControll =
      function ($scope, $rootScope, $uibModalInstance, NgTableParams, DeviceRentLogService, columns) {

        $scope.columns = columns
        $scope.columns.forEach(element => {
          if (element.name == "CurrentTime" ||
            element.name == "serial") {
            element.selected = true;
          } else {
            element.selected = false;
          }
        });
        $scope.columns.push({
          name: "CurrentTime Month",
          selected: false
        })
        $scope.columns.push({
          name: "CurrentTime Year",
          selected: false
        })
        var self = this
        self.selectedSite = 5;
        $scope.cancel = function () {
          $uibModalInstance.dismiss('cancel')
        }
        $scope.EnalbeProject = function () {
          $scope.project = true;
        }
        function loaddata() {
          var query = $scope.search.deviceFilter;
          if (query && query.indexOf(':T') != -1) {
            query = query.substr(0, query.indexOf(':T'))
          }
          $scope.search.BlockDivshow = true;
          return oboe('/api/v1/projects/getprojects?requirement=' + query)
            .done(function (res) {
              $scope.itemArray = [];
              if (res.success == true) {
                $scope.itemArray = res.data;
                $scope.search.BlockDivshow = false;
                if ($scope.itemArray.length == 1) {
                  $scope.project = true;
                }
                if ($scope.applyFilter) {
                  $scope.$digest()
                }
              }
            })
            .fail(function (error) {
              console.log(error);
            });
        }

        $scope.IsArray = Array.isArray || function (obj) {
          return Object.prototype.toString.call(obj) === '[object Array]';
        }

        $scope.HeadWidth = function (head) {
          if (head == "pergroup") return "200px"
          else if (head == "index") return "40px"
          else return "130px"
        }

        $scope.enterSomething = function ($event) {
          if ($event.keyCode == 13) {//回车
            loaddata();
          }
        }
        var date = new Date()
        $scope.dat1 = new Date(date.setDate(date.getDate() - 7))
        date = new Date()
        $scope.dat2 = new Date()
        $scope.format = "yyyy/MM/dd"
        $scope.altInputFormats = ['yyyy/M!/d!'];
        $scope.popup1 = {
          opened: false
        };
        $scope.$watch(function () {
          return $scope.dat1
        }, function (newValue, oldValue) {
          if (newValue > $scope.dat2) {
            alert("开始必须小于结束时间")
            $scope.dat1 = oldValue;
            return
          }
          $scope.QueryMessage()
        }, true);

        $scope.$watch(function () {
          return $scope.dat2
        }, function (newValue, oldValue) {
          if (newValue < $scope.dat1) {
            alert("结束时间必须大于开始时间")
            $scope.dat2 = oldValue;
            return
          }
          $scope.QueryMessage()
        }, true);

        $scope.open1 = function () {
          $scope.popup1.opened = true;
        };
        $scope.popup2 = {
          opened: false
        };
        $scope.open2 = function () {
          $scope.popup2.opened = true;
        };
        $scope.activeTabs = {
          project: true,
          date: false,
          custom: false,
          export_default: true
        }

        var tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        var afterTomorrow = new Date();
        afterTomorrow.setDate(tomorrow.getDate() + 1);
        $scope.events = [
          {
            date: tomorrow,
            status: 'full'
          },
          {
            date: afterTomorrow,
            status: 'partially'
          }
        ];

        $scope.lists = new Array()
        for (var i = 1; i < 100; i++) {
          $scope.lists.push(i);
        }

        $scope.Query = function (params) {
          var count = params.parameters().count;
          var page = params.parameters().page;
          console.log("count:" + count)
          console.log("page:" + page)
          console.log("start Date:" + $scope.dat1)
          console.log("End Date:" + $scope.dat2)


          var datestart = $scope.dat1
          var dateend = $scope.dat2

          var d = new Date();
          console.log('format:' + d.format('yyyy-MM-dd'));
          console.log('type:' + typeof ($scope.dat1))

          return DeviceRentLogService.getStatisticsPerGroup(datestart.format('yyyy-MM-dd'), dateend.format('yyyy-MM-dd'), 'ProjectName', page, count).then(function (data) {
            var ret = data
            params.total(ret.total);
            console.log("all page count:" + ret.total)
            console.log("recv count:" + ret.data.length)
            $scope.pagescount = Math.ceil($scope.tableParams.total() / $scope.tableParams.parameters().count)
            return ret.data;
          })
        }

        $scope.tableParams = new NgTableParams(
          { count: 5 },
          {
            counts: [5, 10, 15, 30, 50],
            getData: $scope.Query
          }
        );

        $scope.pagescount = Math.ceil($scope.tableParams.total() / $scope.tableParams.parameters().count)



        simpleList = [
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


        $scope.Query2 = function (params) {
          var count = params.parameters().count;
          var page = params.parameters().page;
          console.log("count:" + count)
          console.log("page:" + page)
          console.log("start Date:" + $scope.dat1)
          console.log("End Date:" + $scope.dat2)


          var datestart = $scope.dat1
          var dateend = $scope.dat2

          var d = new Date();
          console.log('format:' + d.format('yyyy-MM-dd'));
          console.log('type:' + typeof ($scope.dat1))

          return DeviceRentLogService.getStatisticsPerDate(datestart.format('yyyy-MM-dd'), dateend.format('yyyy-MM-dd'), 'ProjectName', page, count).then(function (data) {
            var ret = data
            params.total(ret.total);
            console.log("all page count:" + ret.total)
            console.log("recv count:" + ret.data.length)
            $scope.pages2count = Math.ceil($scope.tableParamsDate.total() / $scope.tableParamsDate.parameters().count)
            return ret.data;
          })
        }

        $scope.tableParamsDate = new NgTableParams(
          { count: 5 },
          {
            counts: [5, 10, 15, 30, 50],
            getData: $scope.Query2

          }
        );
        $scope.pages2count = Math.ceil($scope.tableParamsDate.total() / $scope.tableParamsDate.parameters().count)

        $scope.Query3 = function (params) {
          var count = params.parameters().count;
          var page = params.parameters().page;
          console.log("count:" + count)
          console.log("page:" + page)
          console.log("start Date:" + $scope.dat1)
          console.log("End Date:" + $scope.dat2)

          var datestart = $scope.dat1
          var dateend = $scope.dat2
          var group_by = "";
          $scope.columns.forEach(element => {
            if (element.selected == true) {
              group_by += element.name + "|"
            }
          });
          if (group_by.indexOf("|") == -1) {
            alert("请选择分组维度")
            return
          } else {
            group_by = group_by.substr(0, group_by.length - 1)
          }
          console.log('group_by:' + group_by)
          var d = new Date();
          console.log('format:' + d.format('yyyy-MM-dd'));
          console.log('type:' + typeof ($scope.dat1))

          return DeviceRentLogService.getStatisticsPerCustom(datestart.format('yyyy-MM-dd'), dateend.format('yyyy-MM-dd'), group_by, page, count).then(function (data) {
            var ret = data
            params.total(ret.total);
            console.log("all page count:" + ret.total)
            console.log("recv count:" + ret.data.length)
            $scope.pagesCustomCount = Math.ceil($scope.tableParamsCustom.total() / $scope.tableParamsCustom.parameters().count)
            return ret.data;
          })
        }
        $scope.tableParamsCustom = new NgTableParams(
          { count: 15 },
          {
            counts: [5, 10, 15, 30, 50, 100],
            getData: $scope.Query3

          }
        );
        $scope.pagesCustomCount = Math.ceil($scope.tableParamsCustom.total() / $scope.tableParamsCustom.parameters().count)


        $scope.QueryMessage = function () {
          if ($scope.activeTabs.project == true) {
            try {
              $scope.tableParams.reload()
            } catch (e) {
              console.log("[Error] $scope.tableParams.reload()");
            }
          } else if ($scope.activeTabs.date == true) {

            try {
              $scope.tableParamsDate.reload()
            } catch (e) {
              console.log("[Error] $scope.tableParamsDate.reload()");
            }
          } else if ($scope.activeTabs.custom == true) {

            try {
              $scope.tableParamsCustom.reload()
            } catch (e) {
              console.log("[Error] $scope.tableParamsCustom.reload()");
            }
          }
        };
        $scope.ColChange = function (column) {
          try {
            return (new Promise(function (resolve) {
              if (column.name == "CurrentTime") {
                for (var i = 0; i < $scope.columns.length; i++) {
                  var element = $scope.columns[i]
                  if (element.name == 'CurrentTime Month' || element.name == 'CurrentTime Year') {
                    element.selected = false
                  }
                };
              }
              else if (column.name == "CurrentTime Month") {

                for (var i = 0; i < $scope.columns.length; i++) {
                  var element = $scope.columns[i]
                  if (element.name == 'CurrentTime' || element.name == 'CurrentTime Year') {
                    element.selected = false
                  }
                };
              }
              else if (column.name == "CurrentTime Year") {
                for (var i = 0; i < $scope.columns.length; i++) {
                  var element = $scope.columns[i]
                  if (element.name == 'CurrentTime' || element.name == 'CurrentTime Month') {
                    element.selected = false
                  }
                };
              }
              console.log("end ")
              resolve(true)
            })).then(function (ret) {
              console.log("reload")
              $scope.tableParamsCustom.reload()
            })

          } catch (e) {
            console.log("[Error] $scope.tableParamsCustom.reload()");
          }

        };
        $scope.ExportExcel = function () {
          console.log("export_default:" + $scope.activeTabs.export_default)
          if ($scope.activeTabs.export_default) {
            var count = 3000;
            var page = 1;
            console.log("count:" + count)
            console.log("page:" + page)
            console.log("start Date:" + $scope.dat1)
            console.log("End Date:" + $scope.dat2)

            var datestart = $scope.dat1
            var dateend = $scope.dat2
            var group_by = "CurrentTime|serial";
            console.log('group_by:' + group_by)
            var d = new Date();
            console.log('format:' + d.format('yyyy-MM-dd'));
            console.log('type:' + typeof ($scope.dat1))

            return DeviceRentLogService.getStatisticsPerCustom(datestart.format('yyyy-MM-dd'), dateend.format('yyyy-MM-dd'), group_by, page, count).then(function (data) {
              var ret = data

              var arrdata = [];
              var totalDevices = {}
              var totalTimer = 0
              ret.data.forEach(element => {
                var ele = {}
                ele.index = element.index
                ele.date = element.pergroup[0]
                ele.serial = element.pergroup[1]
                ele.SumUseTimer = element.SumUseTimer
                ele.user = JSON.stringify(element.owner_name)
                ele.platform = !!element.platform[0].Android ? "Android" : "IOS"
                arrdata.push(ele)
                if (!totalDevices[ele.serial]) {
                  totalDevices[ele.serial] = ele.serial
                }
                totalTimer += ele.SumUseTimer
              })
              var e0 = {}
              arrdata.push(e0)
              var e = {}

              var device_count = 0;
              for (var itname in totalDevices) {
                device_count++;
              }

              e.date = '设备数量'
              e.serial = device_count
              arrdata.push(e)

              var e1 = {}

              e1.date = '总使用时间（分钟）'
              e1.serial = String(totalTimer)
              arrdata.push(e1)

              var option = {};

              option.fileName = 'excel'
              option.datas = [
                {
                  sheetData: arrdata,
                  sheetName: 'sheet',
                  sheetFilter: ['index', 'date', 'serial', 'SumUseTimer', 'user', 'platform'],
                  sheetHeader: ['序号', '日期', '手机序列号', '使用时间(分钟)', '用户', '平台']
                }
              ]
              var toExcel = new ExportJsonExcel(option); //new
              toExcel.saveExcel(); //保存
              return ret.data;
            })
          } else {
            var count = 3000;
            var page = 1;
            var datestart = $scope.dat1
            var dateend = $scope.dat2
            var group_by = "";

            $scope.columns.forEach(element => {
              if (element.selected == true) {
                group_by += element.name + "|"
              }
            });
            if (group_by.indexOf("|") == -1) {
              alert("请选择分组维度")
              return
            } else {
              group_by = group_by.substr(0, group_by.length - 1)
            }

            console.log('group_by:' + group_by)
            var d = new Date();
            console.log('format:' + d.format('yyyy-MM-dd'));
            console.log('type:' + typeof ($scope.dat1))

            return DeviceRentLogService.getStatisticsPerCustom(datestart.format('yyyy-MM-dd'), dateend.format('yyyy-MM-dd'), group_by, page, count).then(function (data) {
              var ret = data
            //  console.log("data:" + JSON.stringify(ret.data))
              var arrdata = [];
              var totalDevices = {}
              var totalTimer = 0
              ret.data.forEach(element => {
                var ele = {}
                ele.index = element.index
                var pergroup = ""
                element.pergroup.forEach(e => {
                  pergroup += JSON.stringify(e) + '\r\n'
                })

                ele.pergroup = pergroup
                ele.SumRealRentTimer = element.SumRealRentTimer
                ele.SumRentTimer = element.SumRentTimer
                ele.SumUseTimer = element.SumUseTimer
                ele.count = element.count
                ele.email = JSON.stringify(element.email)
                ele.manufacturer = JSON.stringify(element.manufacturer)
                ele.model = JSON.stringify(element.model)
                ele.owner_name = JSON.stringify(element.owner_name)
                ele.platform = JSON.stringify(element.platform)
                ele.version = JSON.stringify(element.version)
                ele.mobile_serail = JSON.stringify(element.serial)
                //  ele.platform = !!element.platform[0].Android ? "Android" : "IOS"
                arrdata.push(ele)
                if (!totalDevices[ele.index]) {
                  totalDevices[ele.index] = element.serial
                }
                totalTimer += ele.SumUseTimer
              })
              var e0 = {}
              arrdata.push(e0)
              var e = {}

              var device_count = 0;
              var device_list = {}
              for (var itname in totalDevices) {
                var dev = totalDevices[itname]
                for (var s in dev) {
                  var ser = dev[s]
                  for (n in ser) {
                    if (!device_list[n]) {
                      device_count++;
                      device_list[n] = n
                    }
                  }

                }
              }

              e.pergroup = '设备数量'
              e.SumRealRentTimer = device_count
              arrdata.push(e)

              var e1 = {}

              e1.pergroup = '总使用时间（分钟）'
              e1.SumRealRentTimer = String(totalTimer)
              arrdata.push(e1)

              var option = {};

              option.fileName = 'rent_excel'
              option.datas = [
                {
                  sheetData: arrdata,
                  sheetName: 'sheet',
                  sheetFilter: ['index', 'pergroup', 'SumRealRentTimer', 'SumUseTimer', 'count', 'email', 'manufacturer', 'owner_name', 'platform', 'version'],
                  sheetHeader: ['序号', '分组', '实际租用时间', '使用时间(分钟)', '租用次数', 'email', 'manufacturer', '用户', '平台', '版本']
                }
              ]
              var toExcel = new ExportJsonExcel(option); //new
              toExcel.saveExcel(); //保存
              return ret.data;
            })
          }

        }
        function changePage(nextPage) {
          $scope.tableParams.page(nextPage);
        }
        function changePageSize(newSize) {
          $scope.tableParams.count(newSize);
        }
        function changePageSizes(newSizes) {
          // ensure that the current page size is one of the options
          if (newSizes.indexOf($scope.tableParams.count()) === -1) {
            newSizes.push($scope.tableParams.count());
            newSizes.sort();
          }
          $scope.tableParams.settings({ counts: newSizes });
        }


      }


    DevUsingStatistics.open = function (cols) {
      // $uibModal.controller('DevControll',DevUsingStatisticsControll)
      var modalInstance = $uibModal.open({
        template: require('./de-using-statistics.pug'),
        controller: DevUsingStatistics.DevUsingStatisticsControll,
        component: "ngTable",
        resolve: {
          columns: function () {
            return angular.copy(cols)
          }
        },
        backdrop: 'static',
        size: 'lg'
      })

      return modalInstance.result.then(function (result) {
        if (confirm("需要直接打开手机的远程控制吗？")) {
          return {
            result: true
          }
        }
        else {
          return {
            result: false
          }
        }
      }, function (reason) {
        return {
          result: false

        }
      })
    }


    return DevUsingStatistics
  }
