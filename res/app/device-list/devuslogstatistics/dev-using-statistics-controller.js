module.exports = function DeviceListDetailsDirective($scope, $rootScope, NgTableParams, DeviceRentLogService) {


  var self = this
  self.ShowText = "scopeTextShow"


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
        // we don't got it
      });
  }
  $scope.enterSomething = function ($event) {
    if ($event.keyCode == 13) {//回车
      loaddata();
    }
  }


  $scope.dat1 = new Date() - 1;
  $scope.format = "yyyy/MM/dd";
  $scope.altInputFormats = ['yyyy/M!/d!'];

  $scope.popup1 = {
    opened: false
  };
  $scope.open1 = function () {
    $scope.popup1.opened = true;
  };
  $scope.popup2 = {
    opened: false
  };
  $scope.open2 = function () {
    $scope.popup2.opened = true;
  };

  //$scope.dateOptions = {
  //  customClass: getdayclass,//自定义类名
  //  dateDisabled: false//是否禁用
  //}


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


  $rootScope.current = 1;
  $rootScope.current_count = 5;
  var self = this,
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

  self.selectedSite = 5;


  self.tableParams = new NgTableParams(
    { count: 5 },
    {
      counts: [5, 10, 15],
      getData: function (params) {
        var count = params.parameters().count;
        var page = params.parameters().page;
        console.log("count:" + count)
        console.log("page:" + page)

        return DeviceRentLogService.getStatisticsPerGroup('', '', 'ProjectName', page, count).then(function (data) {
          var ret = data
          params.total(ret.total);
          return ret.data;
        })

      }
    }
  );


  $scope.pageSize = 10

  try {
    console.log("tableParams:" + JSON.stringify($scope.tableParams))
    console.log("settings():" + JSON.stringify($scope.tableParams.settings()))
    console.log("parameters:" + JSON.stringify($scope.tableParams.parameters()))
    console.log("total():" + JSON.stringify($scope.tableParams.total()))

    console.log("pages:" + JSON.stringify($scope.tableParams.pages))

    console.log("params:" + JSON.stringify($scope.tableParams.params))
    console.log("data:" + JSON.stringify($scope.tableParams.data))
  }
  catch (e) {
    console.log("e:" + e)
  }

  self.alertmessage = function (msg) {

    alert(self.selectedSite);
    self.selectedSite = msg;
    alert(self.selectedSite);
    $scope.$digest();
    self.tableParams.count(msg)
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
