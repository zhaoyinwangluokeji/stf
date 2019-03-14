module.exports = function CompatResultCtrl(
  $scope,
  $rootScope,
  $http,
  AppState
) {

  $scope.results = []
  $scope.displayed_result = []
  $scope.show_list = true
  $scope.user = AppState.user
  $scope.selected_id = ''

  $scope.getAllResult = function () {
    return new Promise(function (resolve, reject) {
      data = {}
      $http.post('/auth/api/v1/mock/get-all-compat-result', data)
        .success(function (response) {
          $scope.results = response.data
          //  console.log("results: " + JSON.stringify($scope.results))
          return resolve(response.data)
        })
        .error(function (response) {
          console.log("fail")
          return reject(response.data)
        })
    });
  }

  function updateResultItem(result) {
    var tr = document.getElementById(result.id)
    tr.children[0].innerHTML = result.state
    tr.children[2].innerHTML = result.finished + '/' + result.taskNum
    tr.children[4].innerHTML = result.lastUpdate
    tr.children[5].innerHTML = result.passed + '/' + result.taskNum

  }

  function createResultItem(result) {
    var tr = document.createElement('tr')
    tr.className = 'compat-result-row'
    tr.id = result.id
    var td1 = document.createElement('td')
    td1.innerHTML = result.state
    tr.appendChild(td1)

    var td2 = document.createElement('td')
    td2.innerHTML = result.packageName
    tr.appendChild(td2)

    var td3 = document.createElement('td')
    td3.innerHTML = result.finished + '/' + result.taskNum
    tr.appendChild(td3)

    var td4 = document.createElement('td')
    td4.innerHTML = result.submitTime
    tr.appendChild(td4)

    var td5 = document.createElement('td')
    td5.innerHTML = result.lastUpdate
    tr.appendChild(td5)

    var td6 = document.createElement('td')
    td6.innerHTML = result.passed + '/' + result.taskNum
    tr.appendChild(td6)

    var td7 = document.createElement('td')
    td7.className = 'report-td'
    td7.id = result.id
    var b = document.createElement('b')
    var img = document.createElement('img')
    img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAPCAYAAADtc08vAAAAAXNSR0IArs4c6QAAAP5JREFUKBVjZACChIb7HCCaVLCgQfEHY0DV/Q0M/xk/kaoZrJ6RgYMhoPLBZrI0AzUB9S5iIlczTB/FBrDATEKmY7tfcH95/2MCCxtz5+oG2TvIcuhsDBeANH96/2MxExPjyt+//k4KbXisAtIUVH3fwr/qQQpBAz6/++7KzMDQsrZFfg8nG1scyBCgxqh//xkqxNnYlhE0YEO74oZ1bQrnQAqXN0i9ARnCyMCowyrCEjmrQeobugFYwwBZEcgQIL8KWQyZjREGyJLEsCk2gNG/8sESRkYGNmJsQ1fz/z/DF3QxkvmM2HQAM9hMBgZGQWQ5Rob/79a3KWYgi4HYAIQAStkWpLEyAAAAAElFTkSuQmCC'
    td7.appendChild(img)
    var sp = document.createElement('span')
    sp.innerHTML = '查看报告'
    td7.appendChild(sp)
    td7.onclick = function () {
      clearInterval(itv)
      var compat_report_brief = {
        id: this.id
      }
      $rootScope.$broadcast('compat_report_brief', compat_report_brief)
      $scope.selected_id = this.id
      $scope.show_list = false
      
    }

    tr.appendChild(td7)


    var td8 = document.createElement('td')
    td8.innerHTML = result.user
    tr.appendChild(td8)

    return tr
  }

  function refreshResult() {
    console.log('refreshing result...')
    $scope.getAllResult()
      .then(function () {
        var tbody = document.getElementById('result-body')
        if ($scope.displayed_result.length == 0) {
          $scope.results.forEach(element => {

            tbody.appendChild(createResultItem(element))
            $scope.displayed_result.push(element)
          });
        } else {
          console.log('updating....')
          var lenResult = $scope.results.length
          var lenDisplay = $scope.displayed_result.length
          for (var i = 0; i < lenResult; i++) {
            var finded = false
            for (var j = 0; j < lenDisplay; j++) {
              if ($scope.displayed_result[j].id == $scope.results[i].id) {
                finded = true
                if ($scope.results[i].lastUpdate == $scope.displayed_result[j].lastUpdate) {
                  console.log('no change...')
                } else {
                  console.log('finded, updating result' + JSON.stringify($scope.results[i]))
                  updateResultItem($scope.results[i])
                  $scope.displayed_result[j] = $scope.results[i]
                }
                break
              }
            }
            if (!finded) {
              $scope.displayed_result.push($scope.results[i])
              console.log('Not finded, adding result: ' + JSON.stringify($scope.results[i]))
              tbody.appendChild(createResultItem($scope.results[i]))
            }
          }
        }
      })
  }
  refreshResult()
  var itv = setInterval(refreshResult, 2000)
  $scope.$on('$destroy', function () {
    clearInterval(itv)
  })


  $scope.backToResult = function () {
    $scope.show_list = true
    itv = setInterval(refreshResult, 2000)
  }
}
