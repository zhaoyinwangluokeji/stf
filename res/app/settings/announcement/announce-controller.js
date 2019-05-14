require('./announce.css')
module.exports = function AnnounceController($scope, $http, NgTableParams) {
  $scope.publish = {
    title: "",
    content: ""
  }

  $scope.dialog = {
    newannounce: false,
    modifyanncounce: false
  }
  $scope.new_announce = {
    title: "",
    content: ""
  }

  $scope.switchShow = function () {
    $scope.showUserGroup = !$scope.showUserGroup
  }


  $scope.switchShow = function () {
    $scope.showUserGroup = !$scope.showUserGroup
  }

  $scope.ModifyAnnouncement = function () {
    if (!$scope.CurRow) {
      alert("请选择需要修改的消息！")
    } else {
      $scope.dialog.modifyanncounce = true
    }
  }

  $scope.NewAnnouncement = function () {
    $scope.dialog.newannounce = true

  }

  $scope.DeleteAnnounce = function () {

  }
  var dataset = [{
    index: 1,
    title: "Test Hello World!",
    content: "1 fffffff  ssssssss ddddddddd asssssss dddddddd ffffffa asd asdfa \
              2 sdsd-- sdsds --- sdfsd \
              3 5 232 232 3 23 2 3 2 3 2 3 \
              4 qqqqqqqqqqqqqqqqqqqq \
              5 rrrrrrrrrrrrrrrrrrrr \
              6 yyyyyyyyyyyyyyyyy \
              7 ooooooooooooooooo \
              8 ppppppppppppppppppp \
              9 ffffffffffff \
              ",
    date: '2019/4/18',
    startdate: '2019/4/28',
    enddate: '2020/4/28'
  }]

  $scope.savemodifyannounce = function () {
    $scope.new_announce.title = $scope.CurRow.title
    $scope.new_announce.content = $scope.CurRow.content
    $scope.savenewannounce().then(function () {
      $scope.dialog.modifyanncounce = false
    })
    //  $scope.dialog.modifyanncounce = false
    //  $scope.tableHisAnnounce.reload()
  }

  Date.prototype.format = function (fmt) {
    var o = {
      "M+": this.getMonth() + 1, //月份
      "d+": this.getDate(), //日
      "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时
      "H+": this.getHours(), //小时
      "m+": this.getMinutes(), //分
      "s+": this.getSeconds(), //秒
      "q+": Math.floor((this.getMonth() + 3) / 3), //季度
      "S": this.getMilliseconds() //毫秒
    };
    var week = {
      "0": "/u65e5",
      "1": "/u4e00",
      "2": "/u4e8c",
      "3": "/u4e09",
      "4": "/u56db",
      "5": "/u4e94",
      "6": "/u516d"
    };
    if (/(y+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
      fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
    }
    for (var k in o) {
      if (new RegExp("(" + k + ")").test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
      }
    }
    return fmt;
  }


  $scope.savenewannounce = function () {
    var data = {
      title: $scope.new_announce.title,
      content: $scope.new_announce.content
    }
    return new Promise(function (resolve, reject) {
      $http.post('/auth/api/v1/mock/InsertAnnouncement', data)
        .success(function (response) {
          $scope.new_announce = {
            title: "",
            content: ""
          }
          $scope.dialog.newannounce = false
          $scope.tableHisAnnounce.reload()
          return resolve(response.success)
        })
        .error(function (response) {
          console.log("fail")
          return reject(response.error)
        })
    });
  }


  $scope.queryFilter = ''

  $scope.QueryHisAnnounce = function (params) {
    var data = {
      page: 1,
      count: 15,
      filter: $scope.queryFilter
    }
    return new Promise(function (resolve, reject) {
      $http.post('/auth/api/v1/mock/GetAnnouncementList', data).success(function (ret) {
        var total = ret.data.total;
        var datasets = ret.data.datasets
        if (datasets.length > 0) {
          $scope.publish.title = datasets[0].title
          $scope.publish.content = datasets[0].content
        }
        $scope.tableHisAnnounce.total(total)
        $scope.pagesCustomCount = Math.ceil(total / $scope.tableHisAnnounce.parameters().count)
        datasets.forEach(element => {
          if (element.content.length > 60) {
            element.content_show = element.content.substr(0, 60) + '.....'
          }else{
            element.content_show = element.content
          }
          element.date = (new Date(element.date)).format("yyyy/MM/dd hh:mm")
        });
        return resolve(datasets)
      }).error(function (response) {
        console.log("fail")
        return reject(response.error)
      })
    })

  }

  $scope.HeadWidth = function (head) {
    if (head == "pergroup") return "200px"
    else if (head == "date") return "50px"
    else return "130px"
  }
  $scope.sel = 10;

  $scope.queryannounce = function () {
    $scope.tableHisAnnounce.reload()
  }

  $scope.tableHisAnnounce = new NgTableParams(
    { count: 10 },
    {
      counts: [10, 15, 30, 50, 100],
      getData: $scope.QueryHisAnnounce
    }
  );
  $scope.pagesCustomCount = Math.ceil($scope.tableHisAnnounce.total() / $scope.tableHisAnnounce.parameters().count)

  $scope.RowClick = function (row) {

    $scope.tableHisAnnounce.data.forEach(e => {
      e.selected = false
    })
    //    row.checked = true
    if (row.selected == true) {
      row.selected = false
      $scope.CurRow = null
    }
    else {
      $scope.CurRow = row
      row.selected = true
    }


  }


}
