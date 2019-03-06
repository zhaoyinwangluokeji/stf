

module.exports = function CrawlerCtrl($scope, $http, LightboxImageService) {
  JSZip = require("jszip")
  fs = require("filesaver.js")
  var md5 = require('./md5.js')
  var hex = new md5()

  $scope.xpath = "//*[@text='相机']";
  $scope.crash_log_path = "/sdcard/cmb/log"
  $scope.inputContent = "12345"
  $scope.findEle = null;

  $scope.xmlDom = null;

  $scope.waitForElement = function (xpath, timeout = 15) {
    return $scope.findElementByXpath("//*[@bounds]", timeout).then(function (result) {
      if ($scope.findEle == null) {
        throw new Error("element did not show in " + timeout + "sec.");
      }
    });
  }

  $scope.swipeUp = function () {
    console.log("swiping up...")
    return $scope.swipe(0.5 * $scope.device.display.width, 0.8 * $scope.device.display.height,
      0.5 * $scope.device.display.width, 0.4 * $scope.device.display.height);
  }

  $scope.getPageSize = function () {
    return $scope.device.display;
  }

  $scope.swipe = function (startX, startY, endX, endY) {
    return $scope.control.shell('input swipe ' + startX + ' ' + startY + ' ' + endX + ' ' + endY);
  }

  $scope.clickAndinputText = function (xpath, text, timeout = 10) {
    return $scope.clickElementByXpath(xpath, timeout).then(function (result) {
      return $scope.inputText(text)
    });
  }

  $scope.inputText = function (text) {
    return $scope.control.shell('input keyevent 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112').then(function (result) {
      $scope.control.shell('input text ' + text)
    })
  }

  $scope.clickElementByXpath = function (xpath, timeout = 10) {
    console.log("clicking element...")
    return $scope.findElementByXpath(xpath, timeout).then(function () {
      $scope.clickElement()
    });

  }

  $scope.clickElement = function () {
    if ($scope.findEle == null) {
      throw new Error("element not exits!");
    }
    var searchBounds = $scope.findEle.getAttribute('bounds');
    if (searchBounds == null) {
      throw new Error("node has no bounds，please search other xpath !");
    }
    var bounds = searchBounds.match(/[\d\.]+/g);
    console.log(bounds[0]);
    var clickX = (parseInt(bounds[0]) + parseInt(bounds[2])) / 2;
    var clickY = (parseInt(bounds[1]) + parseInt(bounds[3])) / 2;
    console.log('input tap ' + clickX + " " + clickY);
    return $scope.control.shell('input tap ' + clickX + " " + clickY)
  }

  $scope.findElementByXpath = function (xpath, timeout = 10) {
    $scope.findEle = null;
    console.log("timeout =  " + timeout);
    if (timeout > 0) {
      return $scope.getPageXml().then(function (result) {
        if (xpath == "") {
          console.log("xpath is empty!");
          return;
        } else {
          try {
            if (typeof $scope.xmlDom.evaluate != 'undefined') {
              var result = $scope.xmlDom.evaluate(xpath, $scope.xmlDom, null,
                XPathResult.FIRST_ORDERED_NODE_TYPE, null);
              if (result !== null) {
                $scope.findEle = result.singleNodeValue;
              }
            } else if (typeof $scope.xmlDom.selectSingleNode != 'undefined') {
              $scope.findEle = $scope.xmlDom.selectSingleNode(xpath);
            }
          } catch (e) {
            console.log(e.message)
            $scope.findEle = null;
          }
          if ($scope.findEle == null) {
            timeout = timeout - 1
            return $scope.findElementByXpath(xpath, timeout);
          } else {
            return;
          }
        }
      });
    }
  }
  $scope.path = "";
  $scope.getPageXml = function () {

    return $scope.control.shell('uiautomator dump')
      .then(function (result) {

        // $scope.path = result.data.join('').split(':', 2)[1].trim();
        $scope.path = "/sdcard/window_dump.xml"
        return $scope.control.shell('cat ' + $scope.path)
          .then(function (result) {
            // console.log("xml data: " + result.data.toString())
            $scope.xmlStr = result.data.join('');
            $scope.xmlStr = $scope.xmlStr.replace("<?xml version='1.0' encoding='UTF-8' standalone='yes' ?>", "")
            parser = new DOMParser();
            $scope.xmlDom = parser.parseFromString($scope.xmlStr, "text/xml");
          })
      })
  }


  //开始crawler程序
  //通用配置
  $scope.predict_url = "http://99.13.199.4:8501/v1/models/phone_image_model:predict"
  $scope.predict_result = false
  $scope.max_click = 50
  $scope.max_level = 10
  $scope.wait_sec = 3
  $scope.app_name = "cmb.pb"
  $scope.activity = ".launch.PBInitActivity"
  //安全密码键盘设置
  $scope.secure_keyboard_id = 'cmb.pb:id/cmbkeyboard_view'
  $scope.password = '774411'
  //主页面设置，如果页面包含此元素id，则遍历过程中不会再点返回
  $scope.main_page_ele = 'cmb.pb:id/tvGroupTitle'
  //短信验证码输入框的id特征，如果页面有editText元素id包办下面字符串，则回获取短信验证码并输入
  $scope.msg_code_id = 'MsgCode'
  $scope.verify_code_url = "http://99.12.70.148/UATGetMsgVerifyCode"
  $scope.phone_num = '13600010061'
  $scope.verify_code = ""
  //编辑框设置
  $scope.filling_edittext_default = '100'
  $scope.edittext_content_settings_string = '"MobileNo":"15019467196",\n"PhoneNo": "15019467196",\n"Money":"1",\n"amount":"1",\n"PayeeName":"小豌豆",\n"AccountNo":"6225880280248452"';
  $scope.edittext_content_settings = {};
  $scope.loadEditTextCotentSettings = function () {
    try {
      $scope.edittext_content_settings = JSON.parse('{' + $scope.edittext_content_settings_string + '}');
      console.log($scope.edittext_content_settings);
    } catch (e) {
      alert("json格式不正确！" + e.message)
    }
  }



  $scope.loadEditTextCotentSettings();

  $scope.black_list_string = "是,\n返回,\ncmb.pb:id/vLeftBtnArea,\ncmb.pb:id/lastLoginInfo_textView"
  $scope.black_list = [];
  $scope.white_list_string = "确定,\n确认,\n提交,\n完成,\n我知道了,\n全部,\n继续"
  $scope.white_list = [];
  $scope.loadBlackList = function () {
    try {
      $scope.black_list = $scope.black_list_string.split(',')
      console.log($scope.black_list);
    } catch (e) {
      alert("数组格式不正确！" + e.message)
    }
  }
  $scope.loadBlackList()
  $scope.loadWhiteList = function () {
    try {
      $scope.white_list = $scope.white_list_string.split(',')
      console.log($scope.white_list);
    } catch (e) {
      alert("数组格式不正确！" + e.message)
    }
  }
  $scope.loadWhiteList();

  $scope.predictImgResult = function (img64) {
    return $scope.control.predictImg($scope.predict_url, img64).then(function (result) {
      console.log("got predict result:" + result.data[0]);
      if (result.data[0] == "Success") {
        $scope.predict_result = true
      } else {
        $scope.predict_result = false
      }
    })
  }

  $scope.takeScreenShot = function (operateInfo = "") {
    var c = document.getElementById("live-screen");
    var imgData = c.toDataURL()
    // // imgData = imgData.replace("data:image/png;base64,","")
    // console.log(imgData)
    $scope.tmpImg = imgData
    $scope.$apply(function () {
      var tmpIndex = $scope.screenshots.length
      $scope.screenshots.push(imgData)
      $scope.pic_click_path.push(operateInfo)
      $scope.predictImgResult(imgData.replace("data:image/png;base64,", "")).then(function () {
        if (!$scope.predict_result) {
          $scope.error_screen_indexs.push(tmpIndex)
        }
      })
      var tmp1 = JSON.parse(JSON.stringify($scope.pic_click_path))
      $scope.pic_click_path_list.push(tmp1)
      $scope.click_num += 1
      var tmp3 = $scope.page_content.slice(0)
      $scope.page_cotent_list.push([$scope.click_num, tmp3]);
    })
  }

  $scope.dicNum = { '0': [0.5, 0.85], '1': [0.2, 0.12], '2': [0.5, 0.12], '3': [0.2, 0.12], '4': [0.2, 0.37], '5': [0.5, 0.37], '6': [0.8, 0.37], '7': [0.2, 0.62], '8': [0.5, 0.62], '9': [0.8, 0.62] }

  $scope.inputNumPwd = function (arr, bounds) {
    if (arr.length == 0) {
      return;
    }
    var num = arr.shift();
    var clickX = parseFloat(bounds[0]) + (parseFloat(bounds[2]) - parseFloat(bounds[0])) * $scope.dicNum[num][0];
    var clickY = parseFloat(bounds[1]) + (parseFloat(bounds[3]) - parseFloat(bounds[1])) * $scope.dicNum[num][1];
    console.log("pwd x,y=" + clickX + "," + clickY);
    return $scope.control.shell('input tap ' + clickX + " " + clickY).then(function () {
      return $scope.inputNumPwd(arr, bounds);
    });
  }

  $scope.inputPassword = function (pwdTextId, pwd) {
    return $scope.findElementByXpath("//*[@resource-id='" + pwdTextId + "']", timeout = 5).then(function (result) {
      var searchBounds = $scope.findEle.getAttribute('bounds');
      if (searchBounds == null) {
        throw new Error("node has no bounds，please search other xpath !");
      }
      var bounds = searchBounds.match(/[\d\.]+/g);
      var arr = (pwd + "").split("")
      return $scope.inputNumPwd(arr, bounds)
    });
  }

  $scope.sleep = function (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }

  $scope.getVerifyCode = function () {
    return $scope.control.getverifycode({
      url: $scope.verify_code_url,
      pnumber: $scope.phone_num
    }).then(function (result) {
      console.log("got verify result:" + result.data);
      $scope.verify_code = result.data[0];
    });
  }

  $scope.openApp = function (app) {
    return $scope.control.shell("am start -n " + $scope.app_name + "/" + $scope.activity)
  }

  $scope.root_node = null;
  $scope.page_json = null;
  $scope.page_content = [];
  $scope.page_cotent_list = []
  $scope.page_nodes = [];
  $scope.p_tree = [];
  $scope.content_list = [];
  $scope.clicked_list = [];
  $scope.result_list = [];
  $scope.page_md5 = "";
  $scope.pic_click_path = []
  $scope.pic_click_path_list = []
  $scope.page_stack = []

  $scope.getPageContents = function () {
    $scope.page_content = [];
    return $scope.getPageXml().then(function (result) {
      var nodeLists = $scope.xmlDom.querySelectorAll('node')
      for (var node of nodeLists) {
        if (node.getAttribute('class') != "android.widget.EditText" &&
          (node.getAttribute('text').trim() != ''
            || node.getAttribute('resource-id').trim() != ''
            || node.getAttribute('content-desc').trim() != '')) {
          var searchBounds = node.getAttribute('bounds');
          if (searchBounds == null) {
            console.log("node has no bounds，please search other xpath !");
            continue;
          }
          var bounds = searchBounds.match(/[\d\.]+/g);
          if (parseInt(bounds[1]) > 150 && parseInt(bounds[1]) < $scope.device.display.height - 100) {
            $scope.page_content.push(node.getAttribute('resource-id').trim() + node.getAttribute('text').trim() + node.getAttribute('content-desc').trim())
          }
        }
      }
    })
  }

  $scope.getPageNodes = function () {
    $scope.result_list = [];
    return $scope.getPageXml().then(function (result) {
      var nodeLists = $scope.xmlDom.querySelectorAll('node')
      for (var node of nodeLists) {
        if (node.getAttribute('text').trim() != ''
          || node.getAttribute('resource-id').trim() != ''
          || node.getAttribute('content-desc').trim() != '') {
          var searchBounds = node.getAttribute('bounds');
          if (searchBounds == null) {
            console.log("node has no bounds，please search other xpath !");
            continue;
          }
          var bounds = searchBounds.match(/[\d\.]+/g);
          // console.log("element y = " + parseInt(bounds[1]) + "   device height = " + $scope.device.display.height)
          var tmp = [node.getAttribute('class').toString(), node.getAttribute('text').toString().trim(), node.getAttribute('content-desc').toString().trim(), node.getAttribute('resource-id').toString().trim()]
          if (parseInt(bounds[1]) > 150 && parseInt(bounds[1]) < $scope.device.display.height - 100) {
            if (node.getAttribute('resource-id').indexOf('popup') >= 0 || node.getAttribute('resource-id').indexOf($scope.secure_keyboard_id) >= 0) {
              $scope.putIntoResultList(tmp, 0)
            } else if (node.getAttribute('class').indexOf('EditText') >= 0) {
              $scope.putIntoResultList(tmp, -1)
            } else if ($scope.white_list.indexOf(node.getAttribute('resource-id')) >= 0
              || $scope.white_list.indexOf(node.getAttribute('text')) >= 0
              || $scope.white_list.indexOf(node.getAttribute('content-desc')) >= 0) {
              $scope.putIntoResultList(tmp, 0)
            } else if ($scope.clicked_list.indexOf(tmp.toString()) >= 0) {
              console.log("element already in elist, not added: " + tmp)
            } else if ($scope.black_list.indexOf(node.getAttribute('resource-id')) < 0
              && $scope.black_list.indexOf(node.getAttribute('text')) < 0
              && $scope.black_list.indexOf(node.getAttribute('content-desc')) < 0) {
              // console.log("element added: " + tmp.toString())
              $scope.putIntoResultList(tmp, -1)
            }
          }
        }
      }
      console.log($scope.result_list.toString())
    })
  }

  $scope.putIntoResultList = function (tmpList, location = -1) {
    var len = $scope.result_list.length
    var index = 1;
    for (i = 0; i < len; i++) {
      if (tmpList.toString() == $scope.result_list[i].slice(0, 4).toString()) {
        index++;
      }
    }
    tmpList.push(index);
    if (location == -1) {
      $scope.result_list.push(tmpList)
    } else {
      $scope.result_list.unshift(tmpList)
    }
  }

  $scope.back = function () {
    return $scope.findElementByXpath("//*[@text='" + $scope.main_page_ele
      + "' or @resource-id='" + $scope.main_page_ele
      + "' or @content-desc='" + $scope.main_page_ele
      + "']", 2).then(function () {
        if ($scope.findEle == null) {
          console.log("pressing back...")
          return $scope.control.shell("input keyevent 4").then(function () {
            return $scope.sleep(3000)
          })
        }
      })
  }

  $scope.test_tree = {}
  $scope.test = function () {
    // $scope.getPageContents().then(function () {
    //   console.log($scope.page_content.toString())
    //   console.log(hex.hex_md5($scope.page_content.toString()))
    // })
    var tmp_tree = {}
    $scope.test_tree["1"] = tmp_tree
    return $scope.sleep(5000).then(function () {
      // $scope.test2(tmp_tree)
      console.log("sleep 5 sec...")
    })

  }
  $scope.test2 = function (tree) {
    tree["2"] = "3"
  }

  $scope.getPageMd5 = function () {
    return $scope.getPageContents().then(function () {
      $scope.page_md5 = hex.hex_md5($scope.page_content.toString())
      console.log($scope.page_md5)
    })
  }

  $scope.gen_xpath = function (text, content_desc, resource_id, index) {
    $scope.xpath = "(//*["
    $scope.xpath = (text != "") ? $scope.xpath + "@text='" + text + "'" : $scope.xpath
    $scope.xpath = (text != "" && (content_desc != "" || resource_id != "")) ? $scope.xpath + " and " : $scope.xpath
    $scope.xpath = (content_desc == "") ? $scope.xpath : $scope.xpath + "@content-desc='" + content_desc + "'"
    $scope.xpath = (content_desc != "" && resource_id != "") ? $scope.xpath + " and " : $scope.xpath
    $scope.xpath = (resource_id != "") ? $scope.xpath + "@resource-id='" + resource_id + "'" : $scope.xpath
    $scope.xpath = $scope.xpath + "])[" + index + "]"
    console.log($scope.xpath)
  }

  $scope.click_num = 1;
  $scope.screenshots = []
  $scope.error_screen_indexs = []
  $scope.screenShotSize = 150

  $scope.clear = function () {
    $scope.screenshots = []
  }

  $scope.shotSizeParameter = function (maxSize, multiplier) {
    var finalSize = $scope.screenShotSize * multiplier
    var finalMaxSize = maxSize * multiplier

    return (finalSize === finalMaxSize) ? '' :
      '?crop=' + finalSize + 'x'
  }

  $scope.zoom = function (param) {
    var newValue = parseInt($scope.screenShotSize, 10) + param.step
    if (param.min && newValue < param.min) {
      newValue = param.min
    } else if (param.max && newValue > param.max) {
      newValue = param.max
    }
    $scope.screenShotSize = newValue
  }

  $scope.operateActivities = {}
  function getCurActivity() {
    return $scope.control.shell('dumpsys activity | grep -i run | grep ActivityRecord')
      .then(function (ret) {
        // console.log("Activity Result: " + JSON.stringify(ret.data[0].split('\n')[0].split(' ')))
        var act = ""
        var tmp = ret.data[0].split('\n')[0].split(' ')
        var len = tmp.length
        for (var i = 0; i < len; i++) {
          if (tmp[i].indexOf("com") != -1) {
            console.log("got act: " + tmp[i])
            act = tmp[i]
            break
          }
        }
        console.log("current Activity: " + act)
        if ($scope.operateActivities[act]) {
          $scope.operateActivities[act] += 1
        } else {
          $scope.operateActivities[act] = 1
        }

      })
  }



  $scope.operateElement = function (node, level) {
    //node: class, text, content-desc, id,index
    console.log("operating element..." + node.toString())
    if (node[3] == $scope.secure_keyboard_id) {
      console.log("input secure password")
      return $scope.inputPassword($scope.secure_keyboard_id, $scope.password)
    }
    $scope.gen_xpath(node[1].toString(), node[2].toString(), node[3].toString(), node[4].toString())
    return $scope.findElementByXpath($scope.xpath, 1).then(function () {
      if ($scope.findEle == null) {
        console.log("findEle is null!")
        return
      }
      while ($scope.pic_click_path.length >= level) {
        $scope.pic_click_path.pop()
      }
      return getCurActivity().then(function () {
        if (node[0].indexOf("EditText") >= 0) {
          if (node[3].indexOf($scope.msg_code_id) >= 0) {
            return $scope.getVerifyCode().then(function () {
              return $scope.clickElement().then(function () {
                return $scope.inputText($scope.verify_code)
                  .then(function () {
                    return $scope.takeScreenShot("android input verify code    " + $scope.xpath + "    " + $scope.phone_num);
                  })
              })
            })
          }
          for (var k in $scope.edittext_content_settings) {
            if (node[3].indexOf(k) >= 0) {
              return $scope.clickElement().then(function () {
                return $scope.inputText($scope.edittext_content_settings[k])
                  .then(function () {
                    return $scope.takeScreenShot("input text    " + $scope.xpath + "    " + $scope.edittext_content_settings[k]);
                  })
              })
            }
          }
          return $scope.clickElement().then(function () {
            return $scope.inputText($scope.filling_edittext_default)
              .then(function () {
                return $scope.takeScreenShot("input text    " + $scope.xpath + "    " + $scope.filling_edittext_default);
              })
          })
        } else {
          return $scope.clickElement()
            .then(function () {
              return $scope.sleep($scope.wait_sec * 1000).then(function () {
                console.log("taking screenshot.")
                return $scope.takeScreenShot("click element    " + $scope.xpath);
              })
            })
        }
      })

    })
  }

  $scope.handleResultList = function (list, ptree, level, go_back) {
    if ($scope.endCraw) {
      console.log("craw ended!")
      $scope.endTime = new Date()
      return Promise.resolve()
    }
    if ($scope.click_num > $scope.max_click) {
      console.log("max click number! return:" + $scope.click_num)
      return
    }
    if (list.length == 0) {
      return
    }
    var tmp = list.slice(0)
    var node = tmp.shift()
    var tmpJson = { attributes: {}, isCollapsed: false };
    tmpJson.attributes["class"] = node[0]
    tmpJson.attributes["text"] = node[1]
    tmpJson.attributes["content-desc"] = node[2]
    tmpJson.attributes["resourece-id"] = node[3]
    tmpJson.text = node.toString()
    var sub_tree = []
    tmpJson.children = sub_tree
    ptree.push(tmpJson)
    $scope.$apply()

    return $scope.operateElement(node, level).then(function () {
      if ($scope.findEle != null) {
        var ele_node = node.slice(0, 4)
        $scope.clicked_list.push(ele_node.toString())
        console.log("push into click list: " + $scope.clicked_list)
        if (level < $scope.max_level) {
          console.log("crawing in sub tree!")
          return $scope.craw(level + 1, sub_tree)
            .then(function () {
              return $scope.handleResultList(tmp, ptree, level, go_back)
            })
        }
      } else {
        return $scope.getPageMd5().then(function () {
          if ($scope.page_stack.indexOf($scope.page_md5) == -1) {
            console.log("element not found, page is never met, craw as new page")
            if (level < $scope.max_level) {
              return $scope.craw(level + 1, sub_tree)
                .then(function () {
                  console.log("handle next Result list: " + tmp.toString())
                  return $scope.handleResultList(tmp, ptree, level, go_back)
                })
            }
          } else if (level < $scope.max_level && $scope.page_stack[$scope.page_stack.length - 1] != $scope.page_md5) {
            console.log("element not found, page is not the last page, pop and return: " + $scope.page_stack.toString())
            return Promise.resolve()
          } else if (level < $scope.max_level && $scope.page_stack[$scope.page_stack.length - 1] == $scope.page_md5) {
            console.log("something is wrong...")
            return $scope.handleResultList(tmp, ptree, level, go_back)
          } else {
            return Promise.resolve()
          }
        })
      }
    })
  }

  $scope.craw = function (level, page_tree, go_back = true) {
    console.log("craw level is " + level)
    if ($scope.endCraw) {
      console.log("craw ended!")
      $scope.endTime = new Date()
      return Promise.resolve()
    }
    if ($scope.click_num > $scope.max_click) {
      console.log("max click number! return:" + $scope.click_num)
      return Promise.resolve()
    }
    return $scope.getPageMd5().then(function () {
      if ($scope.page_stack.indexOf($scope.page_md5) >= 0) {
        console.log("page is already in list, go back")
        return Promise.resolve()
      } else if (level > $scope.max_level) {
        console.log("max level! go back")
        $scope.back()
        return Promise.resolve()
      } else {
        $scope.page_stack.push($scope.page_md5)
      }
      return $scope.getPageNodes().then(function () {
        return $scope.handleResultList($scope.result_list, page_tree, level, go_back)
      })
        .then(function () {
          if ($scope.page_stack.indexOf($scope.page_md5) > -1 && $scope.page_stack[$scope.page_stack.length - 1] != $scope.page_md5) {
            console.log("element not found, page is not the last page, pop and return: " + $scope.page_stack.toString())
            return Promise.resolve()
          } else if (!$scope.endCraw) {
            return $scope.findElementByXpath("//*[@scrollable='true']", 1).then(function () {
              if ($scope.findEle != null) {
                return $scope.getPageMd5().then(function () {
                  var old_md5 = $scope.page_md5
                  $scope.swipeUp().then(function () {
                    $scope.sleep($scope.wait_sec * 1000).then(function () {
                      return $scope.getPageMd5().then(function () {
                        if (old_md5 != $scope.page_md5) {
                          while ($scope.pic_click_path.length >= level) {
                            $scope.pic_click_path.pop()
                          }
                          $scope.pic_click_path.push("swipe    500    800    500    200")
                          return $scope.craw(level + 1, page_tree, false)
                        }
                      })
                    })
                  })
                })
                  .then(function () {
                    if (go_back) {
                      return $scope.back()
                    }
                  })
              }
            })
          }
        })
        .then(function () {
          console.log("craw level " + level + " end!")
          $scope.page_stack.pop()
        })
    })
  }
  $scope.startTime = null
  $scope.endTime = null

  $scope.startCraw = function () {
    $scope.click_num = 1
    $scope.screenshots = []
    $scope.endCraw = false;
    $scope.root_node = null;
    $scope.page_json = null;
    $scope.page_content = [];
    $scope.page_cotent_list = []
    $scope.page_nodes = [];
    $scope.p_tree = [];
    $scope.content_list = [];
    $scope.clicked_list = [];
    $scope.result_list = [];
    $scope.page_md5 = "";
    $scope.pic_click_path = []
    $scope.pic_click_path_list = []
    $scope.page_stack = []
    $scope.endTime = null
    $scope.startTime = new Date()
    $scope.craw(1, $scope.p_tree)
  }

  $scope.stopCraw = function () {
    $scope.endCraw = true;
  }

  $scope.clearCraw = function () {
    $scope.click_num = 1
    $scope.screenshots = []
    $scope.endCraw = true;
    $scope.root_node = null;
    $scope.page_json = null;
    $scope.page_content = [];
    $scope.page_cotent_list = []
    $scope.page_nodes = [];
    $scope.p_tree = [];
    $scope.content_list = [];
    $scope.clicked_list = [];
    $scope.result_list = [];
    $scope.page_md5 = "";
    $scope.pic_click_path = []
    $scope.pic_click_path_list = []
    $scope.page_stack = []
    $scope.endTime = null
    $scope.startTime = null
  }

  $scope.endCraw = false;
  $scope.$on("$destroy", function () {
    $scope.endCraw = true;
  })

  function genTableFromDict(dict) {
    var text = '<table align="center" border="1" style="width:80%">'
    for (var key in dict) {
      text += '<tr><td><span>' + key + ':</span></td><td><span>' + dict[key] + '</span></td></tr>'
    }
    text += '</table>'
    return text
  }

  function MillisecondToTime(msd) {
    var time = parseInt(msd) / 1000;
    if (time <= 60) {
      time = time + '秒';
      return time;
    } else if (time > 60 && time < 60 * 60) {
      time = parseInt(time / 60) + "分钟";
      return time;
    } else {
      var hour = parseInt(time / 3600) + "小时";
      var minute = parseInt(parseInt(time % 3600) / 60) + "分钟";
      time = hour + minute;
      return time;
    }
  }

  function genReport() {
    if ($scope.startTime == null) {
      alert("请先开始遍历！")
    }
    reportText = '<!DOCTYPE html><html ><head><meta charset="utf-8"></head><body> <h1 style="text-align:center">深度遍历报告</h1>'
    reportText += '<h2 >基本信息</h2>'
    if ($scope.endTime == null) {
      var end = new Date()
      var elaspe = MillisecondToTime(end - $scope.startTime)
    } else {
      var elaspe = MillisecondToTime($scope.endTime - $scope.startTime)
    }
    var base = {
      "手机系统": $scope.device.platform,
      "手机品牌": $scope.device.manufacturer,
      "手机型号": $scope.device.model,
      "系统版本": $scope.device.version,
      "开始时间": $scope.startTime,
      "执行时间": elaspe,
      "元素点击数量": $scope.click_num,
      "崩溃日志数量": $scope.crash_log_num
    }
    var baseTable = genTableFromDict(base)
    reportText += baseTable

    reportText += '<h2 >Activity Clicked List</h2>'
    var actHead = {
      "Activity ": "操作次数"
    }
    var activityTable = genTableFromDict(actHead)
    reportText += activityTable

    var activityTable = genTableFromDict($scope.operateActivities)
    reportText += activityTable
    reportText += '</body></html>'
    $scope.zip.file("report.html", reportText)
  }
  $scope.crash_log_num = 0

  function getCrashLog() {
    $scope.crash_log_num = 0
    return $scope.control.shell('ls ' + $scope.crash_log_path)
      .then(function (result) {
        var logNames = result.data.join('');
        if (logNames.indexOf("No such file or directory") != -1) {
          alert("崩溃日志路径不存在！")
          return
        }
        if ($scope.startTime == null) {
          alert("深度遍历未开始！")
          return
        }
        startDate = "" + $scope.startTime.getFullYear() + $scope.startTime.getMonth() + $scope.startTime.getDate()

        var names = logNames.split('  ')
        var len = names.length
        var newLogs = []

        for (var i = 0; i < len; i++) {
          var name = names[i].replace("_log.txt", '')
          console.log("log: " + name)
          if (parseInt(name) >= parseInt(startDate)) {
            $scope.crash_log_num += 1
            newLogs.push(names[i])
          }
        }
        return getCrashFile(newLogs)
      })
  }

  function getCrashFile(list) {
    if (list.length == 0) {
      return new Promise()
    }
    var logName = list.shift()
    return $scope.control.shell('cat ' + $scope.crash_log_path + '/' + logName)
      .then(function (result) {
        var tmpLogs = result.data.join('');
        $scope.zip.file("崩溃日志/" + logName, tmpLogs)
      }).then(function () {
        if (list.length > 0) {
          return getCrashFile(list)
        }
      })
  }

  $scope.zip = new JSZip();
  $scope.downloadResult = function () {
    getCrashLog().then(function () {
      genReport()
      var img = $scope.zip.folder("截图");
      var len = $scope.screenshots.length
      var name = ""
      for (i = 0; i < len; i++) {
        name = i + ".png"
        img.file(name, $scope.screenshots[i].replace("data:image/png;base64,", ""), { base64: true });
      }
      $scope.zip.generateAsync({ type: "blob" })
        .then(function (content) {
          // see FileSaver.js
          fs.saveAs(content, "report.zip");
        });
    })
  }


}
