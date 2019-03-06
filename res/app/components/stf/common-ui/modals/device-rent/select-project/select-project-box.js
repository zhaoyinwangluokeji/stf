module.exports = function SelectProjectBox() {
    
    return {
        restrict: 'E', //attribute or element  
        scope: {  
          datas: '=datas'
        },  
        template:  require("./select-project-box.pug"),
        link: function(scope, elem, attr, ctrl) {  
          
            
            scope.tempdatas = scope.datas; //下拉框选项副本  
            scope.hidden=true;//选择框是否隐藏  
            scope.searchField='';//文本框数据  
        //将下拉选的数据值赋值给文本框  
            scope.change=function(x){  
                scope.searchField=x;  
                scope.hidden=true;  
            }  
        //获取的数据值与下拉选逐个比较，如果包含则放在临时变量副本，并用临时变量副本替换下拉选原先的数值，如果数据为空或找不到，就用初始下拉选项副本替换  
            scope.changeKeyValue=function(v){  

                var newDate=[];  //临时下拉选副本  
            //如果包含就添加  
                angular.forEach(scope.datas ,function(data,index,array){  
                    if(data.indexOf(v)>=0){  
                        newDate.unshift(data);  
                    }  
                });  
            //用下拉选副本替换原来的数据  
                scope.datas=newDate;  
            //下拉选展示  
                scope.hidden=false;  
            //如果不包含或者输入的是空字符串则用初始变量副本做替换  
                if(scope.datas.length==0 || ''==v){  
                    scope.datas=scope.tempdatas;  
                }  
                console.log(scope.datas);  
            }  
        }  
      };
}