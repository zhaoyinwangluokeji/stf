var fs = require("fs");
//path模块，可以生产相对和绝对路径
var path = require("path");
//配置远程路径
var pathutil = require('../util/pathutil')
var images = []

var imagesfileutil = module.exports = Object.create(null)

imagesfileutil.findimage = function (filepath, name) {
  return new Promise(function (resolve, reject) {
    var filePath = pathutil.resource(filepath);
    //读取文件存储数组
    var fileArr = [];
    //读取文件目录
    var filename = null
    if (!images || images.length == 0) {
      fs.readdir(filePath, function (err, files) {
        if (err) {
          console.log(err);
          return;
        }
        images = files
        for (var i = 0; i < files.length; i++) {
          var file = files[i];
          if (getfile(file) == name) {
            filename = file
            //  console.log("image:" + filename)
            return resolve(filename)
          }
        }
        return resolve(null)
      })
    } else {
      var files = images
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (getfile(file) == name) {
          filename = file
          //  console.log("image:" + filename)
          return resolve(filename)
        }
      }
      return resolve(null)
    }

  });
}

function getfile(url) {
  var arr = url.split('.');
  //  console.log("get:" + JSON.stringify(arr) + "," + arr[0])
  return arr[0];
}

/*
var file = 'SM-G9209'
var fpath = path.join('app', 'components', 'mobile-images')
var imfiles = imagesfileutil.findimage(fpath, file).then(function (res) {
  console.log("result:" + res)
})
*/

