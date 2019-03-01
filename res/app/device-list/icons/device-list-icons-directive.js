var patchArray = require('./../util/patch-array')

module.exports = function DeviceListIconsDirective(
  $filter
  , gettext
  , DeviceColumnService
  , GroupService
  , StandaloneService
  , DeviceRentService
  , $location
  , AppState
  , socket
) {
  function DeviceItem() {
    return {
      build: function () {
        var li = document.createElement('li')
        li.className = 'cursor-select thumbnail'

        var divHeader = document.createElement('div')
        divHeader.className = "phoneInfoHeader"
        li.appendChild(divHeader)
        var manufacturer = document.createElement('div')
        manufacturer.appendChild(document.createTextNode(''))
        manufacturer.className = "floatleft"
        divHeader.appendChild(manufacturer)
        var headerbtn = document.createElement('div')
        var i = document.createElement('i')
        i.className = "fa fa-times"
        headerbtn.appendChild(i)
        headerbtn.className = "floatright headerbtn pointer"
        divHeader.appendChild(headerbtn)


        var divBody = document.createElement('div')
        divBody.className = "phoneInfoBody"
        li.appendChild(divBody)
        //  var a = document.createElement('a')
        //  divBody.appendChild(a)
        var divImage = document.createElement('div')
        divImage.className = "phoneImgDiv"
        //  var photo = document.createElement('div')
        //  photo.className = 'device-photo-small'
        var a = document.createElement('a')
        var img = document.createElement('img')
        img.className = "phoneImg"
        divImage.appendChild(a)
        a.appendChild(img)
        divBody.appendChild(divImage)

        var divInfo = document.createElement('div')
        divInfo.className = "phoneInfoList"
        divBody.appendChild(divInfo)

        var model = document.createElement('div')
        model.appendChild(document.createTextNode(''))
        model.className = "phoneInfo"
        divInfo.appendChild(model)

        var platform = document.createElement('div')
        platform.className = "phoneInfo"
        platform.appendChild(document.createTextNode(''))
        divInfo.appendChild(platform)

        var display = document.createElement('div')
        display.className = "phoneInfo"
        display.appendChild(document.createTextNode(''))
        divInfo.appendChild(display)

        var state = document.createElement('div')
        state.className = "phoneInfo"
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
        var divheader = li.children[0]
        var divbody = li.children[1]
        var divfoot = li.children[2]

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
        var classes = 'btn btn-xs device-status devRentStatus '
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
              if (device.state === 'available' || device.state === 'Busy' || device.usable) {
                a.href = '#!/control/' + device.serial
                rent_buttona.href = '#!/control/' + device.serial
              }

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
    , template: require('./device-list-icons.pug')
    , scope: {
      tracker: '&tracker'
      , columns: '&columns'
      , sort: '=sort'
      , filter: '&filter'
    }
    , link: function (scope, element) {
      console.log('link  ')
      var tracker = scope.tracker()
      var activeColumns = []
      var activeSorting = []
      var activeFilters = []
      var list = element.find('ul')[0]
      var items = list.childNodes
      var prefix = 'd' + Math.floor(Math.random() * 1000000) + '-'
      var mapping = Object.create(null)
      var builder = DeviceItem()


      function kickDevice(device, force) {
        console.log('kickDevice  ')
        return GroupService.kick(device, force).catch(function (e) {
          //  alert($filter('translate')(gettext('Device cannot get kicked from the group')))
        //  throw new Error(e)
        })
      }

      function inviteDevice(device) {
        console.log('inviteDevice  ')
        return GroupService.invite(device).then(function () {
          scope.$digest()
        })
      }

      element.on('click', function (e) {
        var user = AppState.user
        var id
        console.log('click  ')
        var click_target = ""
        /*
        if (e.target.classList.contains('thumbnail')) {
          id = e.target.id
        } else if (e.target.classList.contains('device-status') ||
          e.target.classList.contains('device-photo-small') ||
          e.target.classList.contains('device-name')) {
          id = e.target.parentNode.parentNode.id
        } else if (e.target.parentNode.classList.contains('device-photo-small')) {
          id = e.target.parentNode.parentNode.parentNode.id
        } else if (e.target.classList.contains('devices-icon-rent-info')) {
          id = e.target.parentNode.parentNode.id
        }else */
        if (e.target.classList.contains("devRentStatus")) {
          id = e.target.parentNode.parentNode.parentNode.id
          click_target = "rent"
        }
        else if (e.target.classList.contains('headerbtn')) {
          id = e.target.parentNode.parentNode.id
          click_target = "stop"
        } else if (e.target.classList.contains('fa-times')) {
          id = e.target.parentNode.parentNode.parentNode.id
          click_target = "stop"
        } else if (e.target.classList.contains('src')) {
          id = e.target.parentNode.parentNode.parentNode.id
          click_target = "use"
        } else if (e.target.classList.contains('devStopBtn')) {
          id = e.target.parentNode.parentNode.id
          click_target = "stop"
        }

        if (id) {
          var device = mapping[id]
          if (click_target == "stop") {
            if (confirm('设备处于使用状态，你确定需要停止租用吗？')) {
              kickDevice(device)
              DeviceRentService.free_rent(device, socket)
              e.preventDefault()
            }
          } else if (click_target == "use") {
            $location.path('/control/' + device.serial);
          } else {
            if (device.using) {
              if (device.owner &&
                device.owner.email &&
                device.owner.name &&
                user &&
                user.name == device.owner.name &&
                user.email == device.owner.email) {
                if (e.target.classList.contains('btn-xs')) {
                  if (confirm('你确定需要停止租用吗？')) {
                    kickDevice(device)
                    DeviceRentService.free_rent(device, socket)
                    e.preventDefault()
                  }
                }
              }
              else {
                e.preventDefault()
              }
            }
            else {
              if (device.using) {
                if (device.owner &&
                  device.owner.email &&
                  device.owner.name &&
                  user &&
                  user.name == device.owner.name &&
                  user.email == device.owner.email) {

                  if (confirm('设备处于使用状态，你确定需要停止租用吗？')) {
                    kickDevice(device)
                    DeviceRentService.free_rent(device, socket)
                    e.preventDefault()
                  }
                }
                else {
                  e.preventDefault()
                }
              }
              else if (device.state === 'available') {
                if (device.device_rent_conf &&
                  device.device_rent_conf.rent) {
                  if (device.device_rent_conf.owner &&
                    device.device_rent_conf.owner.email &&
                    device.device_rent_conf.owner.name &&
                    user) {
                    if (user.name == device.device_rent_conf.owner.name &&
                      user.email == device.device_rent_conf.owner.email) {
                    }
                    else {
                      e.preventDefault()
                      alert("设备已经被" + device.device_rent_conf.owner.name + " " + device.device_rent_conf.owner.email + " 租用")
                    }
                  }
                  else {
                    e.preventDefault()
                  }
                } else {
                  e.preventDefault()
                  if (device.state == "maintain") {
                    alert("warnning:设备处于报修状态中，不能租用!")
                  } else {
                    return Promise.all([device].map(function (device) {
                      return DeviceRentService.open(device)
                    })).then(function (result) {
                      //  console.log("result:" + JSON.stringify(result))
                      if (result[0].result == true) {
                        $location.path('/control/' + result[0].device.serial);
                      }
                    })
                      .catch(function (err) {
                        console.log('err: ', err)
                      })
                  }

                }
              } else if (device.state == 'busy') {
                alert("warnning: 设备繁忙不能租用!")
              } else {
                alert("warnning: 离线设备不能租用!")
              }
              //  else {
              //    e.preventDefault()
              //  }

              /*
              else
              {
                if (e.altKey && device.state === 'available') {
                  inviteDevice(device)
                }
                if (e.shiftKey && device.state === 'available') {
                  StandaloneService.open(device)
                }
              }
              */

            }
          }

        }
        else {
          //  e.preventDefault()
        }
      })

      // Import column definitions
      scope.columnDefinitions = DeviceColumnService

      // Sorting
      scope.sortBy = function (column, multiple) {
        console.log('sortBy  ')
        function findInSorting(sorting) {
          for (var i = 0, l = sorting.length; i < l; ++i) {
            if (sorting[i].name === column.name) {
              return sorting[i]
            }
          }
          return null
        }

        var swap = {
          asc: 'desc'
          , desc: 'asc'
        }

        var fixedMatch = findInSorting(scope.sort.fixed)
        if (fixedMatch) {
          fixedMatch.order = swap[fixedMatch.order]
          return
        }

        var userMatch = findInSorting(scope.sort.user)
        if (userMatch) {
          userMatch.order = swap[userMatch.order]
          if (!multiple) {
            scope.sort.user = [userMatch]
          }
        }
        else {
          if (!multiple) {
            scope.sort.user = []
          }
          scope.sort.user.push({
            name: column.name
            , order: scope.columnDefinitions[column.name].defaultOrder || 'asc'
          })
        }
      }

      // Watch for sorting changes
      scope.$watch(
        function () {
          return scope.sort
        }
        , function (newValue) {
          activeSorting = newValue.fixed.concat(newValue.user)
          scope.sortedColumns = Object.create(null)
          activeSorting.forEach(function (sort) {
            scope.sortedColumns[sort.name] = sort
          })
          sortAll()
        }
        , true
      )

      // Watch for column updates
      scope.$watch(
        function () {
          return scope.columns()
        }
        , function (newValue) {
          updateColumns(newValue)
        }
        , true
      )

      // Update now so that we don't have to wait for the scope watcher to
      // trigger.
      updateColumns(scope.columns())

      // Updates visible columns. This method doesn't necessarily have to be
      // the fastest because it shouldn't get called all the time.
      function updateColumns(columnSettings) {
        var newActiveColumns = []

        // Check what we're supposed to show now
        columnSettings.forEach(function (column) {
          if (column.selected) {
            newActiveColumns.push(column.name)
          }
        })

        // Figure out the patch
        var patch = patchArray(activeColumns, newActiveColumns)

        // Set up new active columns
        activeColumns = newActiveColumns

        return patchAll(patch)
      }

      // Updates filters on visible items.
      function updateFilters(filters) {
        activeFilters = filters
        return filterAll()
      }

      // Applies filteItem() to all items.
      function filterAll() {
        for (var i = 0, l = items.length; i < l; ++i) {
          filterItem(items[i], mapping[items[i].id])
        }
      }

      // Filters an item, perhaps removing it from view.
      function filterItem(item, device) {
        if (match(device)) {
          item.classList.remove('filter-out')
        }
        else {
          item.classList.add('filter-out')
        }
      }

      // Checks whether the device matches the currently active filters.
      function match(device) {
        for (var i = 0, l = activeFilters.length; i < l; ++i) {
          var filter = activeFilters[i]
          var column
          if (filter.field) {
            column = scope.columnDefinitions[filter.field]
            if (column && !column.filter(device, filter)) {
              return false
            }
          }
          else {
            var found = false
            for (var j = 0, k = activeColumns.length; j < k; ++j) {
              column = scope.columnDefinitions[activeColumns[j]]
              if (column && column.filter(device, filter)) {
                found = true
                break
              }
            }
            if (!found) {
              return false
            }
          }
        }
        return true
      }

      // Update now so we're up to date.
      updateFilters(scope.filter())

      // Watch for filter updates.
      scope.$watch(
        function () {
          return scope.filter()
        }
        , function (newValue) {
          updateFilters(newValue)
        }
        , true
      )

      // Calculates a DOM ID for the device. Should be consistent for the
      // same device within the same table, but unique among other tables.
      function calculateId(device) {
        // return prefix + device.serial
        return device.serial
      }

      // Compares two devices using the currently active sorting. Returns <0
      // if deviceA is smaller, >0 if deviceA is bigger, or 0 if equal.
      var compare = (function () {
        var mapping = {
          asc: 1
          , desc: -1
        }
        return function (deviceA, deviceB) {
          var diff

          // Find the first difference
          for (var i = 0, l = activeSorting.length; i < l; ++i) {
            var sort = activeSorting[i]
            diff = scope.columnDefinitions[sort.name].compare(deviceA, deviceB)
            if (diff !== 0) {
              diff *= mapping[sort.order]
              break
            }
          }

          return diff
        }
      })()

      // Creates a completely new item for the device. Means that this is
      // the first time we see the device.
      function createItem(device) {
        var id = calculateId(device)
        var item = builder.build()

        item.id = id
        item.setAttribute('ng-show',true)
        builder.update(item, device)
        mapping[id] = device

        return item
      }

      // Patches all items.
      function patchAll(patch) {
        for (var i = 0, l = items.length; i < l; ++i) {
          patchItem(items[i], mapping[items[i].id], patch)
        }
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
      function insertItem(item, deviceA) {
        return insertItemToSegment(item, deviceA, 0, items.length - 1)
      }

      // Inserts an item into a segment of the table into its correct position
      // according to current sorting. The value of `hi` is the index
      // of the last item in the segment, or -1 if none. The value of `lo`
      // is the index of the first item in the segment, or 0 if none.
      function insertItemToSegment(item, deviceA, low, high) {
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

            var diff = compare(deviceA, deviceB)

            if (diff === 0) {
              after = true
              break
            }

            if (diff < 0) {
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

      // Compares an item to its siblings to see if it's still in the correct
      // position. Returns <0 if the device should actually go somewhere
      // before the previous item, >0 if it should go somewhere after the next
      // item, or 0 if the position is already correct.
      function compareItem(item, device) {
        var prev = item.previousSibling
        var next = item.nextSibling
        var diff

        if (prev) {
          diff = compare(device, mapping[prev.id])
          if (diff < 0) {
            return diff
          }
        }

        if (next) {
          diff = compare(device, mapping[next.id])
          if (diff > 0) {
            return diff
          }
        }

        return 0
      }

      // Sort all items.
      function sortAll() {
        // This could be improved by getting rid of the array copying. The
        // copy is made because items can't be sorted directly.
        var sorted = [].slice.call(items).sort(function (itemA, itemB) {
          return compare(mapping[itemA.id], mapping[itemB.id])
        })

        // Now, if we just append all the elements, they will be in the
        // correct order in the table.
        for (var i = 0, l = sorted.length; i < l; ++i) {
          list.appendChild(sorted[i])
        }
      }

      // Triggers when the tracker sees a device for the first time.
      function addListener(device) {
        if (device.deviceType == '现场测试') {
          return
        }
        console.log('addListener ')
        var item = createItem(device)
        filterItem(item, device)
        insertItem(item, device)
      }

      // Triggers when the tracker notices that a device changed.
      function changeListener(device) {
        if (device.deviceType == '现场测试') {
          return
        }
        //  console.log('device-list-changeListener ')
        var id = calculateId(device)
        //  console.log('device-list-changeListener :' + id)
        var item = list.children[id]

        if (item) {
          //    console.log('device-list-changeListener 2')
          // First, update columns
          updateItem(item, device)

          // Maybe the item is not sorted correctly anymore?
          var diff = compareItem(item, device)
          if (diff !== 0) {
            // Because the item is no longer sorted correctly, we must
            // remove it so that it doesn't confuse the binary search.
            // Then we will simply add it back.
            list.removeChild(item)
            insertItem(item, device)
          }
        }
        else {
          //  console.log('device-list-changeListener 3')
        }
      }

      // Triggers when a device is removed entirely from the tracker.
      function removeListener(device) {
        if (device.deviceType == '现场测试') {
          return
        }
        //console.log('removeListener  ')
        var id = calculateId(device)
        var item = list.children[id]

        if (item) {
          list.removeChild(item)
        }

        delete mapping[id]
      }

      tracker.on('add', addListener)
      tracker.on('change', changeListener)
      tracker.on('remove', removeListener)

      // Maybe we're already late
      tracker.devices.forEach(element => {
        var isAdmin = tracker.getIfAdmin()
        var list = tracker.getUsableList()
        if (isAdmin || list.indexOf(element.serial) > -1) {
          // console.log("device:" + element.serial + " is in list:  " + JSON.stringify(list))
          addListener(element)
        } else {
          // console.log("device:" + element.serial + " is not in list:  " + JSON.stringify(list))
        }
      });
      // tracker.devices.forEach(addListener)

      tracker.emit('emptyFilter')

      scope.$on('$destroy', function () {
        tracker.removeListener('add', addListener)
        tracker.removeListener('change', changeListener)
        tracker.removeListener('remove', removeListener)
      })
    }
  }
}
