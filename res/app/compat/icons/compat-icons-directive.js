var patchArray = require('../util/patch-array')

module.exports = function CompatIconsDirective(
  $http
  , $filter
  , GroupService
  , DeviceRentService
  , $location
  , AppState
  , socket
) {
  function DeviceItem() {
    return {
      build: function () {
        var li = document.createElement('li')
        li.className = 'thumbnail compat-item'
        var img1 = document.createElement('img')
        img1.classList.add('checkImg')
        img1.classList.add('isUnChecked')
        img1.setAttribute('src','data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAAAXNSR0IArs4c6QAAAgpJREFUWAnN1j8sA1EcB/Dv9aL+hKp/FQNpSqNhaAwGJCISIiJiMBE2XUzdLKIWBkMXiQhGExuJMEkYJCSIRCpCJCSt/0kpjYp6V6no3bnete9695a793vv994nv3vXK+PY93q+gAlo3pgbsFEXwzn0hIqB9IT6BekFlQDSA8rAIf42X6PbQ4KTf2O071sLrWgxVYkuKwBxs9RE9RY7sGDvw7S1Uz5ILVRTQSWmrB0xyHxgXxmINqo2txSzNT3IMrBYDBxg+e5YOUgJigUDM5sjukmFsSD2mPLZbKw/+jBzsys6jwuKniH+bDlnylvdjR3nCLqK7AnpJoJYImem3JiPveA1xq62Esb5HVkgLikZ6ujVDyN5HF5bN/pL62P7ZDEs5mp6UZ1bgrO3B4xerCESJR8qicZKjAmGHhY2t8tcXUwUaOMPHob8+CSbNZPXub3QhtBXBMOWBrSarQh8vGDobBXPn2F+mqAv+GEUzBAJSH37Bi1OjFe2gWF+lg4SxIBvBefhR5GVhCFFFYqnS1XqJHSLi/AT6vIs8JPKuC83cPp+H09Nek2pQvFVpSoVn6P0mhaI24w2Km0QbRQVEE0UNRAtFFUQDRR1ULooVUDpoFQDpYpSFZQKSnWQUlRGQEpQGQPJRWUUJAeVcVAylCYgKZRmoP9QmoLEUJqD+ChdgPgorq+Lxv0d/gY11c1m4Uog0gAAAABJRU5ErkJggg==')
        li.appendChild(img1)

        var divHeader = document.createElement('div')
        divHeader.className = "compat-phoneInfoHeader compat-item"
        li.appendChild(divHeader)
        var manufacturer = document.createElement('div')
        manufacturer.appendChild(document.createTextNode(''))
        manufacturer.className = "floatleft compat-item"
        divHeader.appendChild(manufacturer)
        var headerbtn = document.createElement('div')
        var i = document.createElement('i')
        i.className = "fa fa-times compat-item"
        headerbtn.appendChild(i)
        headerbtn.className = "floatright headerbtn pointer compat-item"
        divHeader.appendChild(headerbtn)


        var divBody = document.createElement('div')
        divBody.className = "phoneInfoBody compat-item"
        li.appendChild(divBody)
        //  var a = document.createElement('a')
        //  divBody.appendChild(a)
        var divImage = document.createElement('div')
        divImage.className = "phoneImgDiv compat-item"
        //  var photo = document.createElement('div')
        //  photo.className = 'device-photo-small'
        var a = document.createElement('a')
        var img = document.createElement('img')
        img.className = "phoneImg compat-item"
        divImage.appendChild(a)
        a.appendChild(img)
        divBody.appendChild(divImage)

        var divInfo = document.createElement('div')
        divInfo.className = "phoneInfoList compat-item"
        divBody.appendChild(divInfo)

        var model = document.createElement('div')
        model.appendChild(document.createTextNode(''))
        model.className = "phoneInfo compat-item"
        divInfo.appendChild(model)

        var platform = document.createElement('div')
        platform.className = "phoneInfo compat-item"
        platform.appendChild(document.createTextNode(''))
        divInfo.appendChild(platform)

        var display = document.createElement('div')
        display.className = "phoneInfo compat-item"
        display.appendChild(document.createTextNode(''))
        divInfo.appendChild(display)

        var state = document.createElement('div')
        state.className = "phoneInfo compat-item"
        state.appendChild(document.createTextNode(''))
        divInfo.appendChild(state)

        var divFoot = document.createElement('div')
        //  divFoot.appendChild(document.createTextNode(''))
        //  divFoot.className = "devRentStatus devFree"
        li.appendChild(divFoot)

        var renta = document.createElement('a')
        renta.appendChild(document.createTextNode(''))

        var rentbtn = document.createElement('div')
        rentbtn.appendChild(document.createTextNode(''))
        renta.appendChild(rentbtn)
        divFoot.appendChild(renta)

        var stop_rent_button = document.createElement('div')
        stop_rent_button.appendChild(document.createTextNode('释放'))
        stop_rent_button.classList.add("devStopBtn")
        divFoot.appendChild(stop_rent_button)

        return li

      }
      , update: function (li, device) {
        //  var list = li.find('ul')[0]
        var user = AppState.user
        var is_adminstrator = AppState.is_adminstrator
        var divheader = li.children[1]
        var divbody = li.children[2]
        var divfoot = li.children[3]

        var manufacturer = divheader.firstChild.firstChild
        //  var a = divbody.firstChild
        var a = divbody.firstChild.firstChild

        var img = a.firstChild

        var divInfo = divbody.children[1]
        var model = divInfo.children[0]
        var platform = divInfo.children[1]
        var display = divInfo.children[2]
        var state = divInfo.children[3]
        var rent_button = divfoot.children[0].children[0]
        var rent_buttona = divfoot.children[0]
        var stop_rent_button = divfoot.children[1]
        var headerbtn = divheader.children[1]

        headerbtn.classList.add("nonedisplay")

        // .device-photo-small
        if (img.getAttribute('src') !== device.enhancedImage120) {
          img.setAttribute('src', device.enhancedImage120)
          img.classList.add("pointer")
        }

        manufacturer.nodeValue = device.manufacturer
        model.firstChild.nodeValue = "型号：" + device.enhancedName
        platform.firstChild.nodeValue = "系统：" + device.platform + "" + device.version
        if (device.display) {
          display.firstChild.nodeValue = "分辨率:" + device.display.width + "X" + device.display.height
        } else {
          display.firstChild.nodeValue = "分辨率：----"
        }
        //  state.nodeValue = device.enhancedName
        // .device-name
        //  nt.nodeValue = device.enhancedName

        // button
        state.firstChild.nodeValue = "状态：" + $filter('translate')(device.enhancedStateAction)

        rent_button.firstChild.nodeValue = device.enhancedRentStateMsg

        function getStateClasses(state) {
          var stateClasses = {
            using: 'state-using btn-primary',
            busy: 'state-busy btn-warning',
            available: 'state-available btn-primary-outline',
            ready: 'state-ready btn-primary-outline',
            present: 'state-present btn-primary-outline',
            preparing: 'state-preparing btn-primary-outline btn-success-outline',
            unauthorized: 'state-unauthorized btn-danger-outline',
            offline: 'state-offline btn-warning-outline',
            automation: 'state-automation btn-info'
          }[state]
          if (typeof stateClasses === 'undefined') {
            stateClasses = 'btn-default-outline'
          }
          return stateClasses
        }
        state.className = getStateClasses(device.state) + " phoneInfo"
        function getStateClasses2(state) {
          var stateClasses = {
            using: 'devIsBusy',
            busy: 'devIsBusy',
            available: 'devFree',
            ready: 'devFree',
            present: 'devIsBusy',
            preparing: 'devIspreparing',
            unauthorized: 'devIsOutline',
            offline: 'devIsOutline',
            automation: 'devIsOutline'
          }[state]
          if (typeof stateClasses === 'undefined') {
            stateClasses = 'devIsOutline'
          }
          return stateClasses
        }
        var classes = 'btn btn-xs device-status devRentStatus compat-item '
        rent_button.className = classes + getStateClasses2(device.state)

        if (device.state === 'available') {
          model.classList.add('state-available')
        } else {
          if (model.classList) {
            model.classList.remove('state-available')
          }
        }
        stop_rent_button.classList.add("devStopBtn")
        stop_rent_button.classList.add("nonedisplay")
        if (device.device_rent_conf &&
          device.device_rent_conf.rent) {
          if (device.device_rent_conf.owner &&
            device.device_rent_conf.owner.email &&
            device.device_rent_conf.owner.name &&
            user) {
            if ((user.name == device.device_rent_conf.owner.name &&
              user.email == device.device_rent_conf.owner.email) || is_adminstrator) {
              rent_button.classList.remove("devRentStatus")
              rent_button.classList.add("devRentStatus2")
              stop_rent_button.classList.remove("nonedisplay")
              stop_rent_button.classList.add("display")
              headerbtn.classList.remove("nonedisplay")
              headerbtn.classList.remove("display")
              // if (device.state === 'available' || device.state === 'Busy' || device.usable) {
              //   a.href = '#!/control/' + device.serial
              //   rent_buttona.href = '#!/control/' + device.serial
              // }

            }
          }
        }
        if (device.usable) {
          //  a.href = '#!/control/' + device.serial
          li.classList.remove('device-is-busy')
        }
        else {
          //  a.removeAttribute('href')
          li.classList.add('device-is-busy')
        }
        return li
      }
    }
  }

  return {
    restrict: 'E'
    , template: require('./compat-icons.pug')
    , scope: {
      tracker: '&tracker'
      , columns: '&columns'
      , sort: '=sort'
      , filter: '&filter'
    }
    , link: function (scope, element) {
      console.log('link  ')
      var tracker = scope.tracker()
      var list = element.find('ul')[0]
      var items = list.childNodes
      // var prefix = 'd' + Math.floor(Math.random() * 1000000) + '-'
      var mapping = Object.create(null)
      var builder = DeviceItem()
      scope.uninstall = false

      scope.changeUninstall = function(){
        console.log('uninstall state: ' + scope.uninstall)
      }
      scope.change = function(){
        scope.uninstall = !scope.uninstall
      }

      //过滤功能
      var filter_list = {
        manufacturer : [],
        version: [],
        display: [],
        platform: []
      }
      scope.CompatScreensizeData =[]
      scope.CompatVersionData = []
      scope.CompatManufacturerData = []
      scope.CompatPlatformData = []
      var current_device_serials = tracker.show_device_serials
      scope.installation = null
      scope.$on('installation', function(e, installation) {
        scope.installation = installation.apply(scope)
      })
      scope.ctrlScope = scope
      scope.appAct = {value:''}
      scope.saveAct = function(){
        console.log('scope.appAct:' + scope.appAct.value)
        scope.$apply()
      }

      scope.submit = function(){
        var user = AppState.user
        if(scope.installation == null){
          alert('请上传apk')
          return
        }else if(!scope.installation.manifest.application.launcherActivities && scope.appAct.value == ''){
          alert('请手动设置入口Activity，并且不能为空')
          console.log('scope.appAct:' + scope.appAct.value)
          // scope.activityFound = false
          return
        }else if(selected_serials.length == 0){
          alert('请选择设备')
          return
        }
        var submitTime = new Date()
        if(scope.appAct.value == ''){
          scope.appAct.value = scope.installation.manifest.application.launcherActivities[0].name
        }
        var data = {
          href: scope.installation.href,
          id: scope.installation.id,
          serials: selected_serials,
          package: scope.installation.manifest.package,
          activity: scope.appAct.value,
          version: scope.installation.manifest.versionName,
          uninstall: scope.uninstall,
          time: submitTime,
          user: user.name,
        }
        $http.post('/c/compat/install', data)
          .success(function (response) {
           console.log("success: " + JSON.stringify(response))
           alert('提测成功，请切换到结果测试页面查看进度')
          })
          .error(function (response) {
            console.log("fail: " + JSON.stringify(response))
          })

      }

      function addToData(tag, device, targetData) {
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
        var len = targetData.length
        for (i = 0; i < len; i++) {
          if (value == targetData[i]) {
            return;
          }
        }
        targetData.push(value)
        console.log("adding Data: " + JSON.stringify(targetData))
        
      }

      scope.clickFilter = function(tag,manu,myevent){
        // console.log("tag: " + tag)
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

      filterDeviceShow = function(){
        // console.log("current_device_serials: " + JSON.stringify(current_device_serials))
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
                // console.log("d: " + d)
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
        // console.log("tmp: " + JSON.stringify(tmp))
        // console.log("filtered_serials: " + JSON.stringify(filtered_serials))
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


      // Calculates a DOM ID for the device. Should be consistent for the
      // same device within the same table, but unique among other tables.
      function calculateId(device) {
        // return prefix + device.serial
        return device.serial
      }

      selected_serials = []

      // Creates a completely new item for the device. Means that this is
      // the first time we see the device.
      function createItem(device) {
        var id = calculateId(device)
        var item = builder.build()

        item.onclick = function(){
          if (this.classList.contains("compat-selected")) {
            this.classList.remove('compat-selected')
            this.children[0].className = 'checkImg isUnChecked'
            // console.log('Child className:  ' + this.children[0].className)
            if(selected_serials.indexOf(id) > -1){
              selected_serials.splice(selected_serials.indexOf(id),1)
            }
          }else{
            this.classList.add('compat-selected')
            this.children[0].className = 'checkImg isChecked'
            // console.log('Child className2:  ' + this.children[0].className)
            selected_serials.push(id)
          }
        }
        
        item.id = id
        builder.update(item, device)
        mapping[id] = device

        return item
      }


      // Patches the given item by running the given patch operations in
      // order. The operations must take into account index changes caused
      // by previous operations.
      function patchItem(/*item, device, patch*/) {
        // Currently no-op
      }

      // Updates all the columns in the item. Note that the item must be in
      // the right format already (built with createItem() and patched with
      // patchItem() if necessary).
      function updateItem(item, device) {
        var id = calculateId(device)
        item.id = id
        builder.update(item, device)
        return item
      }

      // Inserts an item into the table into its correct position according to
      // current sorting.
      function insertItem2(item, deviceA) {
        return insertItem2ToSegment(item, deviceA, 0, items.length - 1)
      }

      // Inserts an item into a segment of the table into its correct position
      // according to current sorting. The value of `hi` is the index
      // of the last item in the segment, or -1 if none. The value of `lo`
      // is the index of the first item in the segment, or 0 if none.
      function insertItem2ToSegment(item, deviceA, low, high) {
        var total = items.length
        var lo = low
        var hi = high

        if (lo > hi) {
          // This means that `lo` refers to the first item of the next
          // segment (which may or may not exist), and we should put the
          // row before it.
          list.insertBefore(item, lo < total ? items[lo] : null)
        }
        else {
          var after = true
          var pivot = 0
          var deviceB

          while (lo <= hi) {
            pivot = ~~((lo + hi) / 2)
            deviceB = mapping[items[pivot].id]

            var diff2 = 0

            if (diff2 === 0) {
              after = true
              break
            }

            if (diff2 < 0) {
              hi = pivot - 1
              after = false
            }
            else {
              lo = pivot + 1
              after = true
            }
          }

          if (after) {
            list.insertBefore(item, items[pivot].nextSibling)
          }
          else {
            list.insertBefore(item, items[pivot])
          }
        }
      }

      // Triggers when the tracker sees a device for the first time.
      function addListener2(device) {
        if (device.deviceType == '现场测试') {
          return
        }
        console.log('addListener2 ')
        var item = createItem(device)
        insertItem2(item, device)
        insertItem2(item, device)

        addToData("display", device, scope.CompatScreensizeData)
        addToData("version", device, scope.CompatVersionData)
        addToData("manufacturer", device, scope.CompatManufacturerData)
        addToData("platform", device, scope.CompatPlatformData)
        scope.$apply();
      }

      // Triggers when the tracker notices that a device changed.
      function changeListener2(device) {
        if (device.deviceType == '现场测试') {
          return
        }
        //  console.log('device-list-changeListener2 ')
        var id = calculateId(device)
        //  console.log('device-list-changeListener2 :' + id)
        var item = list.children[id]

        if (item) {
          //    console.log('device-list-changeListener2 2')
          // First, update columns
          updateItem(item, device)
        }
        else {
          //  console.log('device-list-changeListener2 3')
        }
        addToData("display", device, scope.CompatScreensizeData)
        addToData("version", device, scope.CompatVersionData)
        addToData("manufacturer", device, scope.CompatManufacturerData)
        addToData("platform", device, scope.CompatPlatformData)
        scope.$apply();
      }

      // Triggers when a device is removed entirely from the tracker.
      function removeListener2(device) {
        if (device.deviceType == '现场测试') {
          return
        }
        //console.log('removeListener2  ')
        var id = calculateId(device)
        var item = list.children[id]

        if (item) {
          list.removeChild(item)
        }

        delete mapping[id]
      }

      tracker.on('add', addListener2)
      tracker.on('change', changeListener2)
      tracker.on('remove', removeListener2)

      // Maybe we're already late
      tracker.devices.forEach(element => {
        var isAdmin = tracker.getIfAdmin()
        var list = tracker.getUsableList()
        if (isAdmin || list.indexOf(element.serial) > -1) {
          // console.log("device:" + element.serial + " is in list:  " + JSON.stringify(list))
          addListener2(element)
        } else {
          // console.log("device:" + element.serial + " is not in list:  " + JSON.stringify(list))
        }
      });
      // tracker.devices.forEach(addListener2)

      scope.$on('$destroy', function () {
        tracker.removeListener('add', addListener2)
        tracker.removeListener('change', changeListener2)
        tracker.removeListener('remove', removeListener2)
      })
    }
  }
}
