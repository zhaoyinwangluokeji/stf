

var exec = require('child_process').exec;

var dockermanage = module.exports = Object.create(null)

var execute = function (cmd) {
    return new Promise(function (resolve, reject) {
        var consl = exec(cmd, function (error, stdout, stderr) {
            if (error) {
                reject(error)
            }
            else {
                if (stdout.length == 0) {
                    resolve(true)
                } else {
                    resolve(stdout)
                }
            }
        });
        consl.on('exit', function (code) {
            //    console.log('子进程已关闭，代码：' + code);
        });
    });

}

dockermanage.run = function (src_port, dst_port, name, adb_port) {


    var os = require('os');
    var IPv4, hostName;
    hostName = os.hostname();
    for (var i = 0; i < os.networkInterfaces().en0.length; i++) {
        if (os.networkInterfaces().en0[i].family == 'IPv4') {
            IPv4 = os.networkInterfaces().en0[i].address;
        }
    }
    console.log('----------local IP: ' + IPv4);
    console.log('----------local host: ' + hostName);

    adb_port = IPv4 + ':' + adb_port

    var cmd_str = "docker stop " + name + " ; docker rm " + name + " ; docker run -d "
    if (src_port && src_port > 0 && dst_port && dst_port > 0) {
        cmd_str += " -p " + src_port + ":" + dst_port
    }
    cmd_str += " --name " + name + " -e adb_port=" + adb_port+" -e UID="+name
        + " appium/appium /bin/sh /root/start.sh"
    console.log("cmd:" + cmd_str)
    return execute(cmd_str).then(function (ret) {
        var list = []
        var r = ret.split(/\n/)
        if (r.length > 1) {
            console.log("container id:" + r[r.length - 2])
            return r[r.length - 2]
        } else {
            return ret
        }

    }).catch(function (e) {
        cmd_str = "docker restart " + name

        console.log("cmd:" + cmd_str)
        execute(cmd_str).then(function (ret) {
            var list = []
            var r = ret.split(/\n/)
            if (r.length > 1) {
                console.log("container id:" + r[r.length - 2])
                return r[r.length - 2]
            } else {
                return ret
            }
        }).catch(function (e) {
            console.log("e2:" + e)
        })

    })
}

dockermanage.images = function () {
    var cmd_str = "docker images"
    return execute(cmd_str).then(function (ret) {
        console.log("images:" + ret)
        var list = []
        var r = ret.split(/\n/)
        var index = 0
        r.forEach(ele => {
            if (index++ > 0) {
                var arr = ele.split(/\s{2,}/)
                if (arr.length > 1) {
                    list.push(arr)
                }
            }
        });
        console.log(list)
        return list
    })
}

dockermanage.ps = function (para) {
    var cmd_str = "docker ps "
    if (para && para.indexOf('-') == 0) cmd_str += " " + para
    else if (para && para.indexOf('-') == -1) cmd_str += " -" + para
    return execute(cmd_str).then(function (ret) {
        var list = []
        var r = ret.split(/\n/)
        var index = 0
        r.forEach(ele => {
            if (index++ > 0) {
                var arr = ele.split(/\s{2,}/)
                if (arr.length > 5) {
                    list.push(arr[arr.length - 1])
                }
            }
        });
        console.log(list)
        return list
    })
}

dockermanage.stop = function (name) {
    var cmd_str = "docker stop " + name
    return execute(cmd_str).then(function (ret) {
        var list = []
        var r = ret.split(/\n/)
        if (r.length > 1) {
            console.log(r[r.length - 2])
            return r[r.length - 2]
        } else {
            return ret
        }
    })
}

dockermanage.rm = function (name) {
    var cmd_str = "docker rm " + name
    return execute(cmd_str).then(function (ret) {
        var list = []
        var r = ret.split(/\n/)
        if (r.length > 1) {
            console.log(r[r.length - 2])
            return r[r.length - 2]
        } else {
            return ret
        }
    })
}

dockermanage.stop_and_rm = function (name) {
    var cmd_str = "docker rm " + name + " ;docker rm " + name
    return execute(cmd_str).then(function (ret) {
        var list = []
        var r = ret.split(/\n/)
        if (r.length > 1) {
            console.log(r[r.length - 2])
            return r[r.length - 2]
        } else {
            return ret
        }
    })
}

dockermanage.kill = function (name) {
    var cmd_str = "docker kill " + name
    return execute(cmd_str).then(function (ret) {
        var list = []
        var r = ret.split(/\n/)
        if (r.length > 1) {
            console.log(r[r.length - 2])
            return r[r.length - 2]
        } else {
            return ret
        }
    })
}

function nodeifytest(fn) {

    console.log("arguments:" + JSON.stringify(arguments))
    var args = Array.prototype.slice.call(arguments)
    console.log("args:" + JSON.stringify(args))
    var callback = typeof args[args.length - 1] === 'function' ? args.pop() : null
    console.log("callback:" + JSON.stringify(callback))
    var ctx = this
    try {
        return fn.apply(this, arguments).nodeify(callback, ctx)
    } catch (ex) {
        if (callback === null || typeof callback == 'undefined') {
            return new Promise(function (resolve, reject) { reject(ex) })
        } else {
            asap(function () {
                callback.call(ctx, ex)
            })
        }
    }

}

//nodeifytest(dockermanage.run, 4723, 4723, '98edca4f', 12656)
/*
dockermanage.run(4723, 4723, '98edca4f', 12656).then(function (id) {
    console.log(id)
})
*/
/*
dockermanage.ps('-a').then(function(d){
    console.log(d)
})
dockermanage.images().then(function(d){
    console.log(d)
})*/
//dockermanage.stop('98edca4f')
//dockermanage.rm('98edca4f')
//dockermanage.stop_and_rm('98edca4f')
//dockermanage.kill('98edca4f')

/*
function DelayEval(timer) {
    return new Promise(function (resolve, reject) {
        console.log("0")
        setTimeout(() => {
            console.log("timeout")
            resolve(true)
        }, timer);
        console.log("1")
    })
}

DelayEval(3000).then(function (f) {
    console.log(f)
    console.log(3000)
})
*/
