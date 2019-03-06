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
      var current_device_serials = tracker.show_device_serials

      // 默认隐藏原来的统计
      scope.showStats = false
      scope.hideShowStats = function(){
        scope.showStats = !scope.showStats
      }

 
      unhandled_serials = []
      scope.manufacturerData = {
        type: 'doughnut',
        data: {
          datasets: [{
            data: [],
            backgroundColor: [],
            label: 'manufacturer'
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
      // scope.manufacturerChart = null
      // scope.versionChart = null
      // scope.platformChart = null
      // scope.screensizeChart = null
      scope.manufacturerChart = drawChart("manufacturer", scope.manufacturerData)
      scope.versionChart = drawChart("sdkversion", scope.versionData)
      scope.screensizeChart = drawChart("screensize", scope.screensizeData)
      scope.platformChart = drawChart("platform", scope.platformData)

      
      var filter_list = {
        manufacturer : [],
        version: [],
        display: [],
        platform: []
      }

      function emptyFilter(){
        var tmpEles = document.getElementsByClassName('filterOn')
        console.log("tmpEles:  " + JSON.stringify(tmpEles))
        while(tmpEles.length > 0){
          for(i in tmpEles){
            tmpEles[i].className = 'filterOff'
          }
          tmpEles = document.getElementsByClassName('filterOn')
        }
        
        filter_list = {
          manufacturer : [],
          version: [],
          display: [],
          platform: []
        }
      }

      var filtered_serials = current_device_serials.slice(0)
      filterDeviceShow = function(){
        console.log("current_device_serials: " + JSON.stringify(current_device_serials))
        filtered_serials = current_device_serials.slice(0)
        var tmp = {} 
        for(var k in filter_list){
          if(filter_list[k].length == 0){
            tmp[k] = current_device_serials.slice(0)
            continue
          }else{
            tmp[k] =  []
            current_device_serials.forEach(d => {
              filter_list[k].forEach(ele => {
                var value=''
                console.log("d: " + d)
                if(k == 'display'){
                  value = tracker.get(d).display.width + "x" + tracker.get(d).display.height
                }else{
                  value = tracker.get(d)[k]
                }
                if(value == ele){
                  tmp[k].push(tracker.get(d).serial)
                }
              });
            });
          }
        }
        console.log("tmp: " + JSON.stringify(tmp))
        console.log("filtered_serials: " + JSON.stringify(filtered_serials))
        current_device_serials.forEach(ele => {
          var i = filtered_serials.indexOf(ele)
          if(i > -1){
            for(var kk in tmp){
              if(tmp[kk].indexOf(ele) == -1){
                if(filtered_serials.indexOf(ele) > -1){
                  console.log("deleting serial: " + ele)
                  filtered_serials.splice(i,1)
                }
                
              }
            }
          }
        });
        console.log("filtered_serials: " + JSON.stringify(filtered_serials))
        current_device_serials.forEach(ele => {
          if(filtered_serials.indexOf(ele) > -1){
            setDeviceShow(ele,true)
          }else{
            setDeviceShow(ele,false)
          }
        });
      }

      function setDeviceShow(serial,show){
        var target = document.getElementById(serial)
            if(target){
              if(show){
                if(target.className.indexOf('filter-out') > -1){
                  target.classList.remove('filter-out')
                }
              }else{
                if(target.className.indexOf('filter-out') == -1){
                  target.classList.add('filter-out')
                }
              }
            }
      }

      scope.clickFilter = function(tag,manu,myevent){
        console.log("tag: " + tag)
        var target = myevent.target
        if(target.className == 'filterOn'){
          target.className = 'filterOff'
          var i = filter_list[tag].indexOf(manu)
          if(i != -1){
            filter_list[tag].splice(i,1)
          }
        }else{
          target.className = 'filterOn'
          filter_list[tag].push(manu)
        }
        filterDeviceShow()
      }


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
        addToData("manufacturer", device, scope.manufacturerData)
        scope.manufacturerChart.update()
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
          addToData("manufacturer", device, scope.manufacturerData)
          scope.manufacturerChart.update()
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
        delFromData("manufacturer", device, scope.manufacturerData)
        scope.manufacturerChart.update()
        delFromData("platform", device, scope.platformData)
        scope.platformChart.update()
        notify()
      }

      findTextNodes()
      emptyFilter()
      tracker.on('emptyFilter', emptyFilter)
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
