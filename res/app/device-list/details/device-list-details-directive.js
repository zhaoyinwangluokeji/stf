var patchArray = require('./../util/patch-array')

module.exports = function DeviceListDetailsDirective(
  $filter
  , $compile
  , $rootScope
  , socket
  , gettext
  , DeviceColumnService
  , GroupService
  , DeviceService
  , LightboxImageService
  , StandaloneService
  , AppState
  , DeviceRentService
  , $location
) {
  return {
    restrict: 'E'
    , template: require('./device-list-details.pug')
    , scope: {
      tracker: '&tracker'
      , columns: '&columns'
      , sort: '=sort'
      , filter: '&filter'
    }
    , link: function (scope, element) {
      var tracker = scope.tracker()
      var activeColumns = []
      var activeSorting = []
      var activeFilters = []
      var table = element.find('table')[0]
      var tbody = table.createTBody()
      var rows = tbody.rows
      var prefix = 'd' + Math.floor(Math.random() * 1000000) + '-'
      var mapping = Object.create(null)
      var childScopes = Object.create(null)


      function kickDevice(device, force) {
        return GroupService.kick(device, force).catch(function (e) {
          //  alert($filter('translate')(gettext('Device cannot get kicked from the group')))
          throw new Error(e)
        })
      }

      function inviteDevice(device) {
        return GroupService.invite(device).then(function () {
          scope.$digest()
        })
      }

      function checkDeviceStatus(e) {
        var id = e.target.parentNode.parentNode.id
        var device = mapping[id]
        user = AppState.user
        var is_adminstrtor = AppState.is_adminstrtor
        if (e.target.classList.contains('device-rent-status')) {

          var para = arguments
          if (device.device_rent_conf &&
            device.device_rent_conf.rent) {
          }
          else {
            if (device.state === 'available' || (device.deviceType && device.deviceType == "现场测试")) {
              return Promise.all([device].map(function (device) {
                e.preventDefault()
                if (device.state == "maintain") {
                  alert("warnning:设备处于报修状态中，不能租用!")
                } else {
                  return DeviceRentService.open(device)
                }
              })).then(function (result) {
                if (result[0].result == true) {
                  $location.path('/control/' + result[0].device.serial);
                }
              })
                .catch(function (err) {
                  console.log('err: ', err)
                })
            }
          }

        } else if (e.target.classList.contains('device-rent-release-status')) {
          if (device.device_rent_conf &&
            device.device_rent_conf.rent) {
            if (device.device_rent_conf.owner &&
              device.device_rent_conf.owner.email &&
              device.device_rent_conf.owner.name &&
              user) {
              if ((user.name == device.device_rent_conf.owner.name &&
                user.email == device.device_rent_conf.owner.email) || is_adminstrtor) {
                if (confirm('你确定需要停止租用吗？')) {
                  GroupService.kick(device, true)
                  if(tracker.getIfAdmin())
                  {
                    //管理员释放要改变归还状态
                    DeviceRentService.admin_free_rent(device, socket)
                  }
                  else
                  {
                    //DeviceRentService.free_rent(device, socket)
                    DeviceRentService.user_free_rent(device, socket)
                  }
                  e.preventDefault()
                }
              }
              else {
                alert("设备已经被" + device.device_rent_conf.owner.name + " " + device.device_rent_conf.owner.email + " 租用")
              }
            }
          }
        } else if (e.target.classList.contains('device-back-status')) {
          if (tracker.getIfAdmin()) {
            if (confirm('确定归还该设备？')) {
              DeviceRentService.admin_free_rent(device, socket)
              e.preventDefault()
              alert('归还成功！')
            }
          }
          else
          {
            alert("只有管理员才能归还设备！")
          }
        }
      }

      function checkDeviceSmallImage(e) {
        if (e.target.classList.contains('device-small-image-img')) {
          var id = e.target.parentNode.parentNode.parentNode.id
          var device = mapping[id]

          if (device.name && device.image) {
            var title = device.name
            var enhancedPhoto800 = '/static/app/devices/photo/x800/' + device.image
            LightboxImageService.open(title, enhancedPhoto800)
          }
        }
      }

      // On clicking device-note-edit icon
      // This function will create a new angular-xeditable span
      // inside xeditableWrapper and compile it with
      // new child scope.
      // Childscope will be destroyed when the editing will be over
      function checkDeviceNote(e) {
        if (e.target.classList.contains('device-note-edit')) {

          var i = e.target
          var id = i.parentNode.parentNode.id
          var device = mapping[id]
          var xeditableWrapper = i.parentNode.firstChild
          var xeditableSpan = document.createElement('span')
          var childScope = scope.$new()

          // Ref: http://vitalets.github.io/angular-xeditable/#text-btn
          xeditableSpan.setAttribute('editable-text', 'device.notes')
          xeditableSpan.setAttribute('onbeforesave', 'updateNote(id, device.serial, $data)')
          xeditableSpan.setAttribute('onCancel', 'onDeviceNoteCancel(id)')

          childScope.id = id
          childScope.device = device
          childScopes[id] = childScope

          $compile(xeditableSpan)(childScope)
          xeditableWrapper.appendChild(xeditableSpan)

          // Trigger click to open the form.
          angular.element(xeditableSpan).triggerHandler('click')
        }
      }

      function checkDeviceMaintain(e) {
        if (e.target.classList.contains('device-maintain-edit')) {

          var i = e.target

          var id = i.parentNode.parentNode.parentNode.id
          if (!id) {
            id = i.parentNode.parentNode.id
          }
          var device = mapping[id]
          if (device.deviceType != '现场测试') {
            console.log('设备类型为：' + device.deviceType)
            alert('设备类型为现场测试的设备才能报修！')
            return
          }
          if (tracker.getIfAdmin()) {
            console.log('报修设备： ' + device.serial)

            if (device.maintain) {
              console.log('报修状态修改为： false')
              DeviceService.updateMaintain(device.serial, false)
            } else {
              console.log('报修状态修改为： true')
              DeviceService.updateMaintain(device.serial, true)
            }
          } else {
            alert("必须管理员才有权限修改报修状态！")
          }
        }
      }

      function destroyXeditableNote(id) {
        var tr = tbody.children[id]
        for (var i = 0; i < tr.cells.length; i++) {
          var col = tr.cells[i]

          if (col.firstChild &&
            col.firstChild.nodeName.toLowerCase() === 'span' &&
            col.firstChild.classList.contains('xeditable-wrapper')) {

            var xeditableWrapper = col.firstChild
            var children = xeditableWrapper.children

            // Remove all childs under xeditablerWrapper
            for (var j = 0; j < children.length; j++) {
              xeditableWrapper.removeChild(children[j])
            }
          }
        }
        childScopes[id].$destroy()
      }

      scope.updateNote = function (id, serial, note) {
        DeviceService.updateNote(serial, note)
        destroyXeditableNote(id)
      }

      scope.onDeviceNoteCancel = function (id) {
        destroyXeditableNote(id)
      }

      element.on('click', function (e) {
        checkDeviceStatus(e)
        checkDeviceSmallImage(e)
        checkDeviceNote(e)
        checkDeviceMaintain(e)
      })

      // Import column definitions
      scope.columnDefinitions = DeviceColumnService

      // Sorting
      scope.sortBy = function (column, multiple) {
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

      // Applies filterRow() to all rows.
      function filterAll() {
        for (var i = 0, l = rows.length; i < l; ++i) {
          filterRow(rows[i], mapping[rows[i].id])
        }
      }

      // Filters a row, perhaps removing it from view.
      function filterRow(row, device) {
        if (match(device)) {
          row.classList.remove('filter-out')
        }
        else {
          row.classList.add('filter-out')
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
            try {
              var compare = scope.columnDefinitions[sort.name].compare
              if (compare) {
                diff = compare(deviceA, deviceB)
                if (diff !== 0) {
                  diff *= mapping[sort.order]
                  break
                }
              }

            } catch (e) {
              console.log("Error:Fail to compare sort.name:" + sort.name)
            }
          }

          return diff
        }
      })()

      // Creates a completely new row for the device. Means that this is
      // the first time we see the device.
      function createRow(device) {
        var id = calculateId(device)
        var tr = document.createElement('tr')
        var td

        tr.id = id

        /*  if (!device.usable) {
            tr.classList.add('device-not-usable')
          }*/

        for (var i = 0, l = activeColumns.length; i < l; ++i) {
          td = scope.columnDefinitions[activeColumns[i]].build()
          scope.columnDefinitions[activeColumns[i]].update(td, device)
          tr.appendChild(td)
        }

        mapping[id] = device

        return tr
      }

      // Patches all rows.
      function patchAll(patch) {
        for (var i = 0, l = rows.length; i < l; ++i) {
          patchRow(rows[i], mapping[rows[i].id], patch)
        }
      }

      // Patches the given row by running the given patch operations in
      // order. The operations must take into account index changes caused
      // by previous operations.
      function patchRow(tr, device, patch) {
        for (var i = 0, l = patch.length; i < l; ++i) {
          var op = patch[i]
          switch (op[0]) {
            case 'insert':
              var col = scope.columnDefinitions[op[2]]
              tr.insertBefore(col.update(col.build(), device), tr.cells[op[1]])
              break
            case 'remove':
              tr.deleteCell(op[1])
              break
            case 'swap':
              tr.insertBefore(tr.cells[op[1]], tr.cells[op[2]])
              tr.insertBefore(tr.cells[op[2]], tr.cells[op[1]])
              break
          }
        }

        return tr
      }

      // Updates all the columns in the row. Note that the row must be in
      // the right format already (built with createRow() and patched with
      // patchRow() if necessary).
      function updateRow(tr, device) {
        var id = calculateId(device)

        tr.id = id
        /*
                if (!device.usable) {
                  tr.classList.add('device-not-usable')
                }
                else {
                  tr.classList.remove('device-not-usable')
                }*/

        for (var i = 0, l = activeColumns.length; i < l; ++i) {
          scope.columnDefinitions[activeColumns[i]].update(tr.cells[i], device)
        }

        return tr
      }

      // Inserts a row into the table into its correct position according to
      // current sorting.
      function insertRow(tr, deviceA) {
        return insertRowToSegment(tr, deviceA, 0, rows.length - 1)
      }

      // Inserts a row into a segment of the table into its correct position
      // according to current sorting. The value of `hi` is the index
      // of the last item in the segment, or -1 if none. The value of `lo`
      // is the index of the first item in the segment, or 0 if none.
      function insertRowToSegment(tr, deviceA, low, high) {
        var total = rows.length
        var lo = low
        var hi = high

        if (lo > hi) {
          // This means that `lo` refers to the first item of the next
          // segment (which may or may not exist), and we should put the
          // row before it.
          tbody.insertBefore(tr, lo < total ? rows[lo] : null)
        }
        else {
          var after = true
          var pivot = 0
          var deviceB

          while (lo <= hi) {
            pivot = ~~((lo + hi) / 2)
            deviceB = mapping[rows[pivot].id]

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
            tbody.insertBefore(tr, rows[pivot].nextSibling)
          }
          else {
            tbody.insertBefore(tr, rows[pivot])
          }
        }
      }

      // Compares a row to its siblings to see if it's still in the correct
      // position. Returns <0 if the device should actually go somewhere
      // before the previous row, >0 if it should go somewhere after the next
      // row, or 0 if the position is already correct.
      function compareRow(tr, device) {
        var prev = tr.previousSibling
        var next = tr.nextSibling
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

      // Sort all rows.
      function sortAll() {
        // This could be improved by getting rid of the array copying. The
        // copy is made because rows can't be sorted directly.
        var sorted = [].slice.call(rows).sort(function (rowA, rowB) {
          return compare(mapping[rowA.id], mapping[rowB.id])
        })

        // Now, if we just append all the elements, they will be in the
        // correct order in the table.
        for (var i = 0, l = sorted.length; i < l; ++i) {
          tbody.appendChild(sorted[i])
        }
      }

      // Triggers when the tracker sees a device for the first time.
      function addListener(device) {
        // console.log("device list add Listiner: " + device.serial)
        var row = createRow(device)
        filterRow(row, device)
        insertRow(row, device)
      }

      // Triggers when the tracker notices that a device changed.
      function changeListener(device) {
        // console.log('details-list-changeListener')
        var id = calculateId(device)
        var tr = tbody.children[id]

        if (tr) {
          // First, update columns
          updateRow(tr, device)

          // Maybe the row is not sorted correctly anymore?
          var diff = compareRow(tr, device)

          if (diff < 0) {
            // Should go higher in the list
            insertRowToSegment(tr, device, 0, tr.rowIndex - 1)
          }
          else if (diff > 0) {
            // Should go lower in the list
            insertRowToSegment(tr, device, tr.rowIndex + 1, rows.length - 1)
          }
        }
      }

      // Triggers when a device is removed entirely from the tracker.
      function removeListener(device) {
        var id = calculateId(device)
        var tr = tbody.children[id]

        if (tr) {
          tbody.removeChild(tr)
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
