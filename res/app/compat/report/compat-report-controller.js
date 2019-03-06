module.exports = function CompatReportCtrl(
  $scope,
  $rootScope,
  $http,
  AppState
) {
  require("chart.js")

  $scope.compat_report_brief = {}
  $scope.compat_report_detail = null
  $scope.compat_defalt_list_value = '-'
  $scope.report_id = null
  $scope.success_rate = '0%'
  $scope.if_uninstall = '否'
  $scope.$on('compat_report_brief', function (e, value) {
    console.log('got broadcast value: ' + JSON.stringify(value))
    $scope.compat_report_brief = value
    var data = {
      id: $scope.compat_report_brief.id
    }
    $http.post('/auth/api/v1/mock/get-compat-result-by-id', data)
      .success(function (response) {
        console.log("get compat result by id success: " + JSON.stringify(response.data.result))
        $scope.compat_report_detail = response.data.result
        $scope.success_rate = toPercent($scope.compat_report_detail.passed / $scope.compat_report_detail.taskNum)
        if($scope.compat_report_detail.ifUninstall){
          $scope.if_uninstall = '是'
        }else{
          $scope.if_uninstall = '否'
        }
        
        drawSummary()
        drawInstall()
        drawColdStart()
        drawHotStart()
      })
      .error(function (response) {
        console.log("get compat result by id fail")
      })
  })

  function toPercent(point) {
    var str = Number(point * 100).toFixed(1);
    str += "%";
    return str;
  }

  $scope.show_info = true
  $scope.show_list = false
  $scope.showInfo = function () {
    document.getElementById('reportInfoPane').classList.add('show')
    document.getElementById('reportListPane').classList.remove('show')
    $scope.show_info = true
    $scope.show_list = false

  }

  $scope.showList = function () {
    document.getElementById('reportListPane').classList.add('show')
    document.getElementById('reportInfoPane').classList.remove('show')
    $scope.show_info = false
    $scope.show_list = true

  }

  function drawChart(elementId, data) {
    var ctx = document.getElementById(elementId).getContext("2d");
    return new Chart(ctx, data)
  }

  $scope.summaryData = {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [],
        backgroundColor: [],
        label: '通过率'
      }],
      labels: []
    },
    options: {
      responsive: true,
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '机型通过率'
      },
      animation: {
        animateScale: true,
        animateRotate: true
      },
      responsive: true,
      maintainAspectRatio: false
    }
  }

  $scope.installData = {
    type: 'pie',
    data: {
      datasets: [{
        data: [],
        backgroundColor: [],
        label: '安装时间(秒)'
      }],
      labels: []
    },
    options: {
      responsive: true,
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '安装时间(秒)'
      },
      animation: {
        animateScale: true,
        animateRotate: true
      },
      responsive: true,
      maintainAspectRatio: false
    }
  }

  $scope.coldStartData = {
    type: 'pie',
    data: {
      datasets: [{
        data: [],
        backgroundColor: [],
        label: '冷启动时间(毫秒)'
      }],
      labels: []
    },
    options: {
      responsive: true,
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '冷启动时间(毫秒)'
      },
      animation: {
        animateScale: true,
        animateRotate: true
      },
      responsive: true,
      maintainAspectRatio: false
    }
  }

  $scope.hotStartData = {
    type: 'pie',
    data: {
      datasets: [{
        data: [],
        backgroundColor: [],
        label: '热启动时间(毫秒)'
      }],
      labels: []
    },
    options: {
      responsive: true,
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '热启动时间(毫秒)'
      },
      animation: {
        animateScale: true,
        animateRotate: true
      },
      responsive: true,
      maintainAspectRatio: false
    }
  }

  


  $scope.sumChart = drawChart('summaryChart', $scope.summaryData)
  $scope.installChart = drawChart('installChart', $scope.installData) 
  $scope.coldStartChart = drawChart('coldStartChart', $scope.coldStartData) 
  $scope.hotStartChart = drawChart('hotStartChart', $scope.hotStartData) 

  function drawSummary() {
    $scope.summaryData.data.datasets = [{
      data: [],
      backgroundColor: [],
      label: '通过率'
    }]
    $scope.summaryData.data.labels = []
    $scope.summaryData.data.datasets[0].data.push($scope.compat_report_detail.passed)
    $scope.summaryData.data.datasets[0].backgroundColor.push('#21f505')
    $scope.summaryData.data.labels.push('测试通过')

    $scope.summaryData.data.datasets[0].data.push($scope.compat_report_detail.finished - $scope.compat_report_detail.passed)
    $scope.summaryData.data.datasets[0].backgroundColor.push('#F7464A')
    $scope.summaryData.data.labels.push('测试失败')

    $scope.summaryData.data.datasets[0].data.push($scope.compat_report_detail.taskNum - $scope.compat_report_detail.finished)
    $scope.summaryData.data.datasets[0].backgroundColor.push('#222222')
    $scope.summaryData.data.labels.push('测试未完成')

    $scope.sumChart.update()

  }

  function drawInstall() {
    $scope.installData.data.datasets = [{
      data: [],
      backgroundColor: [],
      label: '安装时间（秒）'
    }]
    $scope.installData.data.labels = []
    var len = $scope.compat_report_detail.data.length
    // <5秒
    var time1 = 0
    // 5-10秒
    var time2 = 0
    //10-20秒 
    var time3 = 0
    // > 20秒
    var time4 = 0
    var fail = 0
    for(var i=0;i<len;i++){
      if($scope.compat_report_detail.data[i].installResult == 'fail'){
        fail++
      }else if($scope.compat_report_detail.data[i].installTime < 5){
        time1++
      }else if($scope.compat_report_detail.data[i].installTime < 10){
        time2++
      }
      else if($scope.compat_report_detail.data[i].installTime < 20){
        time3++
      }
      else{
        time4++
      }
    }

    $scope.installData.data.datasets[0].data.push(time1)
    $scope.installData.data.datasets[0].backgroundColor.push('#21f505')
    $scope.installData.data.labels.push('0～5秒')

    $scope.installData.data.datasets[0].data.push(time2)
    $scope.installData.data.datasets[0].backgroundColor.push('#a1f505')
    $scope.installData.data.labels.push('5～10秒')

    $scope.installData.data.datasets[0].data.push(time3)
    $scope.installData.data.datasets[0].backgroundColor.push('#e3f301')
    $scope.installData.data.labels.push('10～20秒')

    $scope.installData.data.datasets[0].data.push(time4)
    $scope.installData.data.datasets[0].backgroundColor.push('#f38a01')
    $scope.installData.data.labels.push('大于20秒')

    $scope.installData.data.datasets[0].data.push(fail)
    $scope.installData.data.datasets[0].backgroundColor.push('#F7464A')
    $scope.installData.data.labels.push('安装失败')

    $scope.installChart.update()

  }

  function drawHotStart() {
    $scope.hotStartData.data.datasets = [{
      data: [],
      backgroundColor: [],
      label: '热启动时间(毫秒)'
    }]
    $scope.hotStartData.data.labels = []
    var len = $scope.compat_report_detail.data.length
    // <0.1秒
    var time1 = 0
    // 0.1-0.5秒
    var time2 = 0
    // 0.5-3秒 
    var time3 = 0
    // > 3秒
    var time4 = 0
    var fail = 0
    for(var i=0;i<len;i++){
      if($scope.compat_report_detail.data[i].launchResult == null || $scope.compat_report_detail.data[i].launchResult == 'fail'){
        fail++
      }else if($scope.compat_report_detail.data[i].hotLuanchTime < 100){
        time1++
      }else if($scope.compat_report_detail.data[i].hotLuanchTime < 500){
        time2++
      }
      else if($scope.compat_report_detail.data[i].hotLuanchTime < 3000){
        time3++
      }
      else{
        time4++
      }
    }

    $scope.hotStartData.data.datasets[0].data.push(time1)
    $scope.hotStartData.data.datasets[0].backgroundColor.push('#21f505')
    $scope.hotStartData.data.labels.push('0～100毫秒')

    $scope.hotStartData.data.datasets[0].data.push(time2)
    $scope.hotStartData.data.datasets[0].backgroundColor.push('#a1f505')
    $scope.hotStartData.data.labels.push('100～500毫秒')

    $scope.hotStartData.data.datasets[0].data.push(time3)
    $scope.hotStartData.data.datasets[0].backgroundColor.push('#e3f301')
    $scope.hotStartData.data.labels.push('500～3,000毫秒')

    $scope.hotStartData.data.datasets[0].data.push(time4)
    $scope.hotStartData.data.datasets[0].backgroundColor.push('#f38a01')
    $scope.hotStartData.data.labels.push('大于3,000毫秒')

    $scope.hotStartData.data.datasets[0].data.push(fail)
    $scope.hotStartData.data.datasets[0].backgroundColor.push('#F7464A')
    $scope.hotStartData.data.labels.push('启动失败')

    $scope.hotStartChart.update()
  }

  function drawColdStart() {
    $scope.coldStartData.data.datasets = [{
      data: [],
      backgroundColor: [],
      label: '冷启动时间(毫秒)'
    }]
    $scope.coldStartData.data.labels = []
    var len = $scope.compat_report_detail.data.length
    // <1秒
    var time1 = 0
    // 1-2秒
    var time2 = 0
    // 2-5秒 
    var time3 = 0
    // > 5秒
    var time4 = 0
    var fail = 0
    for(var i=0;i<len;i++){
      if($scope.compat_report_detail.data[i].launchResult == null || $scope.compat_report_detail.data[i].launchResult == 'fail'){
        fail++
      }else if($scope.compat_report_detail.data[i].launchTime < 1000){
        time1++
      }else if($scope.compat_report_detail.data[i].launchTime < 2000){
        time2++
      }
      else if($scope.compat_report_detail.data[i].launchTime < 5000){
        time3++
      }
      else{
        time4++
      }
    }

    $scope.coldStartData.data.datasets[0].data.push(time1)
    $scope.coldStartData.data.datasets[0].backgroundColor.push('#21f505')
    $scope.coldStartData.data.labels.push('0～1,000毫秒')

    $scope.coldStartData.data.datasets[0].data.push(time2)
    $scope.coldStartData.data.datasets[0].backgroundColor.push('#a1f505')
    $scope.coldStartData.data.labels.push('1,000～2,000毫秒')

    $scope.coldStartData.data.datasets[0].data.push(time3)
    $scope.coldStartData.data.datasets[0].backgroundColor.push('#e3f301')
    $scope.coldStartData.data.labels.push('2,000～5,000毫秒')

    $scope.coldStartData.data.datasets[0].data.push(time4)
    $scope.coldStartData.data.datasets[0].backgroundColor.push('#f38a01')
    $scope.coldStartData.data.labels.push('大于5,000毫秒')

    $scope.coldStartData.data.datasets[0].data.push(fail)
    $scope.coldStartData.data.datasets[0].backgroundColor.push('#F7464A')
    $scope.coldStartData.data.labels.push('启动失败')

    $scope.coldStartChart.update()
  }
  $scope.order = 'manufacturer'
  $scope.selectOrder = function(orderValue){
    if($scope.order == orderValue){
      $scope.order = '-' + orderValue
    }else{
      $scope.order = orderValue
    }
    
  }


}
