var oboe = require('oboe')

module.exports = function ProjectSynService(
    AppState) {
    return {
        ProjectSyn: function () {
            var user = AppState.user.name
            return new Promise(function (resolve, reject) {
                oboe('/api/v1/projects/updateProjects?user=' + user)
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