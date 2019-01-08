var _ = require('lodash')

var filterOps = {
  '<': function (a, filterValue) {
    return a !== null && a < filterValue
  }
  , '<=': function (a, filterValue) {
    return a !== null && a <= filterValue
  }
  , '>': function (a, filterValue) {
    return a !== null && a > filterValue
  }
  , '>=': function (a, filterValue) {
    return a !== null && a >= filterValue
  }
  , '=': function (a, filterValue) {
    return a !== null && a === filterValue
  }
}

module.exports = function LogColumnService(
  $filter,
  gettext,
  $location,
  DeviceRentService,
  AppState,
  GroupService,
  socket

) {

  // Definitions for all possible values.
  return {
    manufacturer: TextCell({
      title: gettext('品牌')
      , value: function (log_row) {
        return $filter('translate')(log_row.manufacturer)
      }
    })
    , CurrentTime: TextCell({
      title: gettext('租用时间')
      , value: function (log_row) {
        return $filter('translate')(log_row.CurrentTime)
      }
    })
    , serial: LinkCell({
      title: gettext('序列号')
      , target: '_blank'
      , value: function (log_row) {
        return log_row.serial
      }
      , link: function (device) {
        return '_blank'
      }
    })
    , model: TextCell({
      title: gettext('型号')
      , value: function (log_row) {
        return $filter('translate')(log_row.model)
      }
    })
    , platform: TextCell({
      title: gettext('操作系统')
      , value: function (log_row) {
        return $filter('translate')(log_row.platform)
      }
    })
    , version: TextCell({
      title: gettext('版本')
      , value: function (log_row) {
        return $filter('translate')(log_row.version)
      }
    })

    , owner_email: TextCell({
      title: gettext('用户email')
      , value: function (log_row) {
        return $filter('translate')(log_row.owner_email)
      }
    })
    , owner_group: TextCell({
      title: gettext('用户组')
      , value: function (log_row) {
        return $filter('translate')(log_row.owner_group)
      }
    })
    , owner_name: TextCell({
      title: gettext('用户名')
      , value: function (log_row) {
        return $filter('translate')(log_row.owner_name)
      }
    })


    , ProjectCode: TextCell({
      title: gettext('项目编号')
      , value: function (log_row) {
        return $filter('translate')(log_row.ProjectCode)
      }
    })
    , ProjectName: TextCell({
      title: gettext('项目名')
      , value: function (log_row) {
        return $filter('translate')(log_row.ProjectName)
      }
    })

    , real_rent_time: TextCell({
      title: gettext('使用时间')
      , value: function (log_row) {
        return $filter('translate')(log_row.real_rent_time)
      }
    })
    , rent_time: TextCell({
      title: gettext('申请时长')
      , value: function (log_row) {
        return $filter('translate')(log_row.rent_time)
      }
    })
    // , start_time: NumberCell({
    //   title: gettext('开始时间')
    //   , value: function (log_row) {
    //     return $filter('translate')(log_row.start_time)
    //   }
    //   , format: function (value) {
    //     return value === null ? '' : value
    //   }
    // })
    , test_centerCode: TextCell({
      title: gettext('资产编号')
      , value: function (log_row) {
        return $filter('translate')(log_row.test_centerCode)
      }
    })
    , device_type: TextCell({
      title: gettext('设备类型')
      , value: function (log_row) {
        return $filter('translate')(log_row.device_type)
      }
    })
    , mac_address: TextCell({
      title: gettext('mac地址')
      , value: function (log_row) {
        return $filter('translate')(log_row.mac_address)
      }
    })

  }
}

function zeroPadTwoDigit(digit) {
  return digit < 10 ? '0' + digit : '' + digit
}

function compareIgnoreCase(a, b) {
  var la = (a || '').toString().toLowerCase()
  var lb = (b || '').toString().toLowerCase()
  if (la === lb) {
    return 0
  }
  else {
    return la < lb ? -1 : 1
  }
}

function filterIgnoreCase(a, filterValue) {
  var va = (a || '').toString().toLowerCase()
  var vb = filterValue.toString().toLowerCase()
  return va.indexOf(vb) !== -1
}

function compareRespectCase(a, b) {
  if (a === b) {
    return 0
  }
  else {
    return a < b ? -1 : 1
  }
}


function TextCell(options) {
  return _.defaults(options, {
    title: options.title
    , defaultOrder: 'asc'
    , build: function () {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
    , update: function (td, item) {
      var t = td.firstChild
      t.nodeValue = options.value(item)
      return td
    }
    , compare: function (a, b) {
      return compareIgnoreCase(options.value(a), options.value(b))
    }
    , filter: function (item, filter) {
      return filterIgnoreCase(options.value(item), filter.query)
    }
  })
}

function NumberCell(options) {
  return _.defaults(options, {
    title: options.title
    , defaultOrder: 'asc'
    , build: function () {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
    , update: function (td, item) {
      var t = td.firstChild
      t.nodeValue = options.format(options.value(item))
      return td
    }
    , compare: function (a, b) {
      var va = options.value(a) || 0
      var vb = options.value(b) || 0
      return va - vb
    }
    , filter: (function () {
      return function (item, filter) {
        return filterOps[filter.op || '='](
          options.value(item)
          , Number(filter.query)
        )
      }
    })()
  })
}

function DateCell(options) {
  return _.defaults(options, {
    title: options.title
    , defaultOrder: 'desc'
    , build: function () {
      var td = document.createElement('td')
      td.appendChild(document.createTextNode(''))
      return td
    }
    , update: function (td, item) {
      var t = td.firstChild
      var date = options.value(item)
      if (date) {
        t.nodeValue = date.getFullYear()
          + '-'
          + zeroPadTwoDigit(date.getMonth() + 1)
          + '-'
          + zeroPadTwoDigit(date.getDate())
      }
      else {
        t.nodeValue = ''
      }
      return td
    }
    , compare: function (a, b) {
      var va = options.value(a) || 0
      var vb = options.value(b) || 0
      return va - vb
    }
    , filter: (function () {
      function dateNumber(d) {
        return d
          ? d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate()
          : 0
      }
      return function (item, filter) {
        var filterDate = new Date(filter.query)
        var va = dateNumber(options.value(item))
        var vb = dateNumber(filterDate)
        return filterOps[filter.op || '='](va, vb)
      }
    })()
  })
}

function LinkCell(options) {
  return _.defaults(options, {
    title: options.title
    , defaultOrder: 'asc'
    , build: function () {
      var td = document.createElement('td')
      var a = document.createElement('a')
      a.appendChild(document.createTextNode(''))
      td.appendChild(a)
      return td
    }
    , update: function (td, item) {
      var a = td.firstChild
      var t = a.firstChild
      var href = options.link(item)
      if (href) {
        a.setAttribute('href', href)
      }
      else {
        a.removeAttribute('href')
      }
      a.target = options.target || ''
      t.nodeValue = options.value(item)
      return td
    }
    , compare: function (a, b) {
      return compareIgnoreCase(options.value(a), options.value(b))
    }
    , filter: function (item, filter) {
      return filterIgnoreCase(options.value(item), filter.query)
    }
  })
}

function DeviceBrowserCell(options) {
  return _.defaults(options, {
    title: options.title
    , defaultOrder: 'asc'
    , build: function () {
      var td = document.createElement('td')
      var span = document.createElement('span')
      span.className = 'device-browser-list'
      td.appendChild(span)
      return td
    }
    , update: function (td, device) {
      var span = td.firstChild
      var browser = options.value(device)
      var apps = browser.apps.slice().sort(function (appA, appB) {
        return compareIgnoreCase(appA.name, appB.name)
      })

      for (var i = 0, l = apps.length; i < l; ++i) {
        var app = apps[i]
        var img = span.childNodes[i] || span.appendChild(document.createElement('img'))
        var src = '/static/app/browsers/icon/36x36/' + (app.type || '_default') + '.png'

        // Only change if necessary so that we don't trigger a download
        if (img.getAttribute('src') !== src) {
          img.setAttribute('src', src)
        }

        img.title = app.name + ' (' + app.developer + ')'
      }

      while (span.childNodes.length > browser.apps.length) {
        span.removeChild(span.lastChild)
      }

      return td
    }
    , compare: function (a, b) {
      return options.value(a).apps.length - options.value(b).apps.length
    }
    , filter: function (device, filter) {
      return options.value(device).apps.some(function (app) {
        return filterIgnoreCase(app.type, filter.query)
      })
    }
  })
}
