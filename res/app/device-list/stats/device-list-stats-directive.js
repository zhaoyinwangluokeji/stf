module.exports = function DeviceListStatsDirective(
  UserService
) {
  return {
    restrict: 'E'
    , template: require('./device-list-stats.pug')
    , scope: {
      tracker: '&tracker'
    }
    , link: function (scope, element) {
      var tracker = scope.tracker()
      var mapping = Object.create(null)
      var nodes = Object.create(null)
      require("chart.js")
 
      unhandled_serials = []
      scope.modelData = {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [],
            backgroundColor: [],
            label: 'model'
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
            text: '手机品牌'
          },
          animation: {
            animateScale: true,
            animateRotate: true
          },
          responsive: true,
          maintainAspectRatio: false

        }
      }
      scope.versionData = {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [],
            backgroundColor: [],
            label: 'version'
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
            text: '系统版本'
          },
          animation: {
            animateScale: true,
            animateRotate: true
          },
          responsive: true,
          maintainAspectRatio: false
        }
      }
      scope.screensizeData = {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [],
            backgroundColor: [],
            label: 'screensize'
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
            text: '分辨率'
          },
          animation: {
            animateScale: true,
            animateRotate: true
          },
          responsive: true,
          maintainAspectRatio: false
        }
      }
      scope.platformData = {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [],
            backgroundColor: [],
            label: 'platform'
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
            text: '手机操作系统'
          },
          animation: {
            animateScale: true,
            animateRotate: true
          },
          responsive: true,
          maintainAspectRatio: false
        }
      }
      // scope.modelChart = null
      // scope.versionChart = null
      // scope.platformChart = null
      // scope.screensizeChart = null
      scope.modelChart = drawChart("model", scope.modelData)
      scope.versionChart = drawChart("sdkversion", scope.versionData)
      scope.screensizeChart = drawChart("screensize", scope.screensizeData)
      scope.platformChart = drawChart("platform", scope.platformData)

      scope.chartOptions = {
        responsive: true,
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Chart.js Doughnut Chart'
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }

      // console.log('DeviceListStatsDirective initial ')
      scope.counter = {
        total: 0
        , usable: 0
        , busy: 0
        , using: 0
      }

      scope.currentUser = UserService.currentUser

      function findTextNodes() {
        // console.log('findTextNodes ')
        var elements = element[0].getElementsByClassName('counter')
        for (var i = 0, l = elements.length; i < l; ++i) {
          nodes[elements[i].getAttribute('data-type')] = elements[i].firstChild
        }
      }

      function notify() {
        nodes.total.nodeValue = scope.counter.total
        nodes.usable.nodeValue = scope.counter.usable
        nodes.busy.nodeValue = scope.counter.busy
        nodes.using.nodeValue = scope.counter.using
      }

      function updateStats(device) {
        return (mapping[device.serial] = {
          usable: device.usable ? 1 : 0
          , busy: device.owner ? 1 : 0
          , using: device.using ? 1 : 0
        })
      }

      function drawChart(elementId, data) {
        var ctx = document.getElementById(elementId).getContext("2d");
        return new Chart(ctx, data)
      }

      function addToData(tag, device, targetData, chart) {
        var value = ""
        if (tag == "display") {
          if(device.display){
            value = device.display.width + "x" + device.display.height
          }else{
            value = undefined
          }
          
        } else {
          value = device[tag]
        }
        var len = targetData.data.labels.length
        for (i = 0; i < len; i++) {
          if (value == targetData.data.labels[i]) {
            targetData.data.datasets[0].data[i]++
            return;
          }
        }
        var rColor1 = randomHexColor()
        console.log("color: " + rColor1)
        targetData.data.datasets[0].data.push(1)
        targetData.data.datasets[0].backgroundColor.push(rColor1)
        targetData.data.labels.push(value)
        // console.log("adding Data: " + JSON.stringify(targetData.data))
      }

      function delFromData(tag, device, targetData, chart) {
        var value = ""
        if (tag == "display") {
          if(device.display){
            value = device.display.width + "x" + device.display.height
          }else{
            value = "null"
          }
        } else {
          value = device[tag]
        }
        for (i = 0; i < len; i++) {
          if (value == targetData.data.labels[i]) {
            if (targetData.data.datasets[0].data[i] <= 1) {
              targetData.data.datasets[0].data.splice(i, 1)
              targetData.data.labels.splice(i, 1)
              return
            } else {
              targetData.data.datasets[0].data[i]--
              return
            }
          }
        }
      }

      function randomHexColor() { //随机生成十六进制颜色
        return ('#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).substr(-6)).toUpperCase();
      }

      function addListener(device) {
        // console.log('addListener '+device.serial)
        var stats = updateStats(device)

        scope.counter.total += 1
        scope.counter.usable += stats.usable
        scope.counter.busy += stats.busy
        scope.counter.using += stats.using

        if(!device.display){
          console.log("unhandled serial: "+device.serial)
          unhandled_serials.push(device.serial)
          return
        }
        addToData("display", device, scope.screensizeData)
        scope.screensizeChart.update()
        addToData("version", device, scope.versionData)
        scope.versionChart.update()
        addToData("manufacturer", device, scope.modelData)
        scope.modelChart.update()
        addToData("platform", device, scope.platformData)
        scope.platformChart.update()
        notify()
      }

      function changeListener(device) {

      //  console.log('stats-changeListener ' + device.serial)
        var tmp = unhandled_serials.indexOf(device.serial)
        if(tmp != -1 && device.display){
          console.log("handling serial: "+device.serial)
          addToData("display", device, scope.screensizeData)
          scope.screensizeChart.update()
          addToData("version", device, scope.versionData)
          scope.versionChart.update()
          addToData("manufacturer", device, scope.modelData)
          scope.modelChart.update()
          addToData("platform", device, scope.platformData)
          scope.platformChart.update()
          unhandled_serials.splice(tmp,1)
        }
        
        var oldStats = mapping[device.serial]
        var newStats = updateStats(device)
        var diffs = Object.create(null)

        scope.counter.usable += diffs.usable = newStats.usable - oldStats.usable
        scope.counter.busy += diffs.busy = newStats.busy - oldStats.busy
        scope.counter.using += diffs.using = newStats.using - oldStats.using

        if (diffs.usable || diffs.busy || diffs.using) {
          notify()
        }
      }

      function removeListener(device) {
        console.log('removeListener ' + device.serial)


        var oldStats = mapping[device.serial]
        var newStats = updateStats(device)

        scope.counter.total -= 1
        scope.counter.busy += newStats.busy - oldStats.busy
        scope.counter.using += newStats.using - oldStats.using

        delete mapping[device.serial]

        delFromData("display", device, scope.screensizeData)
        scope.screensizeChart.update()
        delFromData("version", device, scope.versionData)
        scope.versionChart.update()
        delFromData("manufacturer", device, scope.modelData)
        scope.modelChart.update()
        delFromData("platform", device, scope.platformData)
        scope.platformChart.update()
        notify()
      }

      findTextNodes()

      tracker.on('add', addListener)
      tracker.on('change', changeListener)
      tracker.on('remove', removeListener)

      scope.$on('$destroy', function () {

        tracker.removeListener('add', addListener)
        tracker.removeListener('change', changeListener)
        tracker.removeListener('remove', removeListener)
      })
    } 
  }
}
