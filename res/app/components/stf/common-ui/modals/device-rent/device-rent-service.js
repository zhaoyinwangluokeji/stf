var oboe = require('oboe')
module.exports =
  function DeviceRentServiceFactory($uibModal, $location, $route, $interval,socket,AppState
    ) {
    var DeviceRentService={}
    var rent_time=[
        {
            time:10,
            title:"10分钟",
            selected:false
        },
        {
            time:30,
            title:"30分钟",
            selected:false
        },
        {
            time:60,
            title:"1小时",
            selected:false
        },
        {
            time:120,
            title:"2小时",
            selected:true
        },
        {
            time:240,
            title:"4小时",
            selected:false
        },
        {
            time:480,
            title:"8小时",
            selected:false
        }
        ,
        {
            time:720,
            title:"12小时",
            selected:false
        }
        ,
        {
            time:1440,
            title:"24小时",
            selected:false
        }
    ]

    var DeviceRentControll=["$scope","$uibModalInstance","device",function($scope, $uibModalInstance,device) {
        $scope.device= device;
        $scope.rent_times = rent_time
        $scope.rent_time_selected =  device.deivce_rent_conf.rent_time
        $scope.RentEnble=$scope.rent_time_selected && $scope.project
        $scope.project = false;
        $scope.Rent = function() {
            if(!$scope.rent_time_selected){
                alert('请选择租用时间')
            }else{

                if(!$scope.search.deviceFilter){
                    alert('请关联项目')
                }else{
                    if($scope.search.deviceFilter.indexOf(":T")== -1){
                        alert('项目格式错误')
                    }
                    else{
                        var query = $scope.search.deviceFilter;
                        var proName = query.substr(0,query.indexOf(':T'))
                        var proCode = query.substr(query.indexOf(':T')+1)
                        $scope.device.deivce_rent_conf={
                            rent:true,
                            rent_time:$scope.rent_time_selected,
                            start_time:Date.now(),
                            now:   Date.now(),
                            owner:  {
                                email:AppState.user.email,
                                group:AppState.user.group,
                                name:AppState.user.name
                            },
                            project: {
                                ProjectName:proName,
                                ProjectCode:proCode
                            }
                        }
                        socket.emit('device.rent_conf.set', $scope.device)
                        $uibModalInstance.close(true)
                    }
                    
                }

            }
            
        }
        $scope.cancel = function() {
            $uibModalInstance.dismiss('cancel')
            // $uibModalInstance.close(true)
            // $route.reload()
        }
        $scope.datas = ["key4","xyz","key3","xxxx","key2","value2","key1","value1"]; //下拉框选项  


        Array.prototype.filter2 =  function(func) {
            var arr = this;
            var r = [];
           for (var i = 0; i < arr.length; i++) {
               if (func(arr[i],i,arr)) {
                   if(r.length<100){
                    r.push(arr[i]);
                   }
                   else{
                       break;
                   }
                   
                }
           }
           return r;
        }
        $scope.EnalbeProject = function(){
            $scope.project  = true;
        }
        
        
        function loaddata() {

            
            var query=$scope.search.deviceFilter;
            if(query && query.indexOf(':T')!= -1) {
                query = query.substr(0,query.indexOf(':T'))
            }
            $scope.search.BlockDivshow = true;
            return  oboe('/api/v1/projects/getprojects?requirement='+query)
                .done(function(res) {
                    $scope.itemArray=[];
                    if(res.success == true){
                         $scope.itemArray= res.data;
                         $scope.search.BlockDivshow = false;
                         if($scope.itemArray.length == 1){
                            $scope.project  = true;
                         }
                         if($scope.applyFilter){
                            $scope.$digest()     
                         }
                    }
                 })
                 .fail(function(error) {
                    console.log(error);
                    // we don't got it
                 });
        }

        $scope.enterSomething= function($event) {
            if($event.keyCode==13) {//回车
                loaddata();
            }
        }

        $scope.itemArray = [];
        $scope.dataArray = [];
        $scope.search = {
            deviceFilter: '',
            selectproject:'',
            focusElement: false,
            BlockDivshow:false
        }
        $scope.applyFilter = function(query) {
            console.log('applyFilter  ')
            $scope.project = false;
            console.log(JSON.stringify(query))
            $scope.filter = function(query) {
                console.log('filter  ')
                return true;
            }
        //    $scope.search.deviceFilter = query;
           
        }

        $scope.$watch('search.selectproject', 
            function(newValue, oldValue) {
                if (newValue != oldValue) {
                  $scope.project  = true;
                }
        })
        /*
            $scope.itemArray = $scope.dataArray.filter2(function (element, index, self) {
                return (element.ProjectName.indexOf(query) != -1);
               });
        */
    //  loaddata();
    // $scope.selected = { value: $scope.itemArray[0] };
        }]
    DeviceRentService.open = function(device) {
      var modalInstance = $uibModal.open({
        template: require('./device-rent-dialog.pug'),
        controller: DeviceRentControll,
        resolve: {
          device: function() {
            return device
          }
        },
        backdrop :'static',
        size:'sm'
      })

        return modalInstance.result.then(function(result) {
            if(confirm("需要直接打开手机的远程控制吗？")){
                return {
                    result:true,
                    device:device,
                    message:"open"
                }
            }
            else {
                return {
                    result:false,
                    device:device,
                    message:"not open"
                }
            }
        }, function(reason) {
                return {
                        result:false,
                        device:device,
                        message:reason
                    }
        })
        
    }
     
    DeviceRentService.free_rent = function(device,socket)  {
        if(device.deivce_rent_conf )    {
            device.deivce_rent_conf.rent = false;
        }
        socket.emit('device.rent_conf.set', device)
    }
     
    return DeviceRentService
  }
