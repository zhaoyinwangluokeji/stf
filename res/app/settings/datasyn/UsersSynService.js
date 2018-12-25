var oboe = require('oboe')

module.exports = function UsersSynService(
    AppState) {
    return {
        UsersSyn: function () {
            var user = AppState.user.name
            return new Promise(function (resolve, reject) {
                oboe('/api/v1/user/updateAllUsers?user=' + user)
                    .done(function (res) {
                        resolve(res);
                    })
                    .fail(function (error) {
                        console.log(error);
                        reject({ success: false, info: error });
                    });
            })
        }
    }

}