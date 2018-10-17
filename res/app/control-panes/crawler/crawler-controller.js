
module.exports = function CrawlerCtrl($scope, $http, LightboxImageService) {

  $scope.xpath = "//*[@text='相机']";
  $scope.inputContent = "12345"
  $scope.findEle = null;

  $scope.xmlDom = null;





  $scope.waitForElement = function(xpath, timeout=15){
    return $scope.findElementByXpath("//*[@bounds]",timeout).then(function (result) {
      if($scope.findEle == null){
        throw new Error("element did not show in " + timeout + "sec.");
      }
    });
  }

  $scope.swipeUp = function(){
    console.log("swiping up...")
    $scope.swipe(0.5*$scope.device.display.width,0.8*$scope.device.display.height,
      0.5*$scope.device.display.width,0.4*$scope.device.display.height);
  }

  $scope.getPageSize = function(){
    return $scope.device.display;
  }

  $scope.swipe = function(startX, startY, endX, endY){
    $scope.control.shell('input swipe ' + startX + ' ' + startY + ' ' + endX + ' ' + endY);
  }

  $scope.inputText = function(xpath, text, timeout=10){
    return $scope.clickElementByXpath(xpath,timeout=10).then(function (result) {
      $scope.control.shell('input keyevent 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 67 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112 112').then(function (result) {
        $scope.control.shell('input text ' + text)
      })
    });
  }

  $scope.clickElementByXpath = function(xpath,timeout=10){
    console.log("clicking element...")
    return $scope.findElementByXpath(xpath,timeout=10).then(function (result) {
      if($scope.findEle == null){
        throw new Error("cannot find element by Xpath:" + xpath);
      }
      var searchBounds = $scope.findEle.getAttribute('bounds');
      if(searchBounds == null){
        throw new Error("node has no bounds，please search other xpath !");
      }
      var bounds = searchBounds.match(/[\d\.]+/g);
      console.log(bounds[0]);
      var clickX = (parseInt(bounds[0]) + parseInt(bounds[2]))/2;
      var clickY = (parseInt(bounds[1]) + parseInt(bounds[3]))/2;
      console.log('input tap ' + clickX + " " + clickY);
      $scope.control.shell('input tap ' + clickX + " " + clickY)
    });
    
  }

  $scope.findElementByXpath = function(xpath,timeout){
    $scope.findEle = null;
    console.log("timeout =  " + timeout);
    if (timeout > 0){
      return $scope.getPageXml().then(function (result) {
        if(xpath == ""){
          console.log("xpath is empty!");
          return;
        }else{
          try
          {
            if (typeof $scope.xmlDom.evaluate != 'undefined') {
              var result = $scope.xmlDom.evaluate(xpath, $scope.xmlDom, null,
                XPathResult.FIRST_ORDERED_NODE_TYPE, null);
              if (result !== null) {
                $scope.findEle = result.singleNodeValue;
              }
            } else if (typeof $scope.xmlDom.selectSingleNode != 'undefined') {
              $scope.findEle = $scope.xmlDom.selectSingleNode(xpath);
            }
          } catch(e){
            console.log(e.message)
            $scope.findEle = null;
          }
          if($scope.findEle == null){
            timeout-=1
            return $scope.findElementByXpath(xpath,timeout);
          } else{
            return;
          }
        }
      });
    }
  }
  $scope.path = "";
  $scope.getPageXml = function(){

    return $scope.control.shell('uiautomator dump')
      .then(function (result) {
        $scope.path = result.data.join('').split(':', 2)[1].trim();
        return $scope.control.shell('cat ' + $scope.path)
          .then(function (result) {
            $scope.xmlStr = result.data.join('');
            parser = new DOMParser();
            $scope.xmlDom = parser.parseFromString($scope.xmlStr,"text/xml");
            console.log("xmlstr: " + $scope.xmlStr)
          })
      })
  }


  //开始crawler程序
  //通用配置
  $scope.max_click = 5
  $scope.max_level = 2
  $scope.wait_sec = 3
  //安全密码键盘设置
  $scope.secure_keyboard_id = 'cmb.pb:id/cmbkeyboard_view'
  $scope.password = '774411'
  //主页面设置，如果页面包含此元素id，则遍历过程中不会再点返回
  $scope.main_page_ele = 'cmb.pb:id/tvGroupTitle'
  //短信验证码输入框的id特征，如果页面有editText元素id包办下面字符串，则回获取短信验证码并输入
  $scope.msg_code_id = 'MsgCode'
  $scope.phone_num = '15019467196'
  //编辑框设置
  $scope.filling_edittext_default = '100'
  $scope.edittext_content_settings_string = '"MobileNo":"15019467196",\n"PhoneNo": "15019467196",\n"Money":"1",\n"amount":"1",\n"PayeeName":"小豌豆",\n"AccountNo":"6225880280248452"';
  $scope.edittext_content_settings = {};
  $scope.loadEditTextCotentSettings = function(){
    try{
      $scope.edittext_content_settings = JSON.parse('{'+$scope.edittext_content_settings_string+'}');
      console.log($scope.edittext_content_settings);
    }catch(e){
      alert("json格式不正确！"+e.message)
    }
  }

  
    
  $scope.loadEditTextCotentSettings();
  
  $scope.black_list_string = "是,\n返回,\ncmb.pb:id/vLeftBtnArea,\ncmb.pb:id/lastLoginInfo_textView"
  $scope.black_list = [];
  $scope.white_list_string = "确定,\n确认,\n提交,\n完成,\n我知道了,\n全部,\n继续"
  $scope.white_list = [];
  $scope.loadBlackList = function(){
    try{
      $scope.black_list = $scope.black_list_string.split(',')
      console.log($scope.black_list);
    }catch(e){
      alert("数组格式不正确！"+e.message)
    }
  }
  $scope.loadWhiteList = function(){
    try{
      $scope.white_list = $scope.white_list_string.split(',')
      console.log($scope.black_list);
    }catch(e){
      alert("数组格式不正确！"+e.message)
    }
  }

  $scope.takeScreenShot = function () {
    $scope.screenshot = null;
    $scope.showNode = null;
    $scope.nodesArray = null;
    $scope.control.screenshot().then(function (result) {
      $scope.$apply(function () {
        $scope.screenshot = result;
      })
      img.src = result.body.href
    })

  }
  $scope.dicNum = {'0':[0.5,0.85],'1':[0.2,0.12],'2':[0.5,0.12],'3':[0.2,0.12],'4':[0.2,0.37],'5':[0.5,0.37],'6':[0.8,0.37],'7':[0.2,0.62],'8':[0.5,0.62],'9':[0.8,0.62]}

  $scope.inputNumPwd = function(arr,bounds){
    if(arr.length == 0){
      return;
    }
    var num = arr.shift();
    var clickX = parseFloat(bounds[0]) + (parseFloat(bounds[2])-parseFloat(bounds[0]))*$scope.dicNum[num][0];
    var clickY = parseFloat(bounds[1]) + (parseFloat(bounds[3])-parseFloat(bounds[1]))*$scope.dicNum[num][1];
    console.log("pwd x,y=" + clickX + ","+clickY);
    return $scope.control.shell('input tap ' + clickX + " " + clickY).then(function (result) {
      return $scope.inputNumPwd(arr,bounds);
    });
  }

  $scope.inputPassword = function(pwdTextId,pwd){
    return $scope.findElementByXpath("//*[@resource-id='" + pwdTextId + "']",timeout=10).then(function (result) {
      var searchBounds = $scope.findEle.getAttribute('bounds');
      if(searchBounds == null){
        throw new Error("node has no bounds，please search other xpath !");
      }
      var bounds = searchBounds.match(/[\d\.]+/g);
      var arr = (pwd+"").split("")
      return $scope.inputNumPwd(arr,bounds)
    });
  }

  $scope.getBaidu = function(){
    return $scope.control.getverifycode().then(function (result) {
      console.log("got verify result:" + result.data);
    });
  }
}
