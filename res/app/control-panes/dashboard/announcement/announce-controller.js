module.exports = function AnnounceControl($scope, $http, NgTableParams) {
  /*
    var contexts = [{
      title: "heavy schoolwork",
      contents:"  In my opinion, the schoolwork now being assigned to high school "
    }]
  */
  var contexts = {
    title: "heavy schoolwork",
    content: "  In my opinion, the schoolwork now being assigned to high school \
    students is too heavy. While it is true that students need to study, \
    they need other things as well if they are to grow into healthy and \
    well-rounded adults. High school students should be allowed more time for play. \
    Playing is not wasting time, as some think. It gives them physical exercise, \
    and also exercises their imagination. Which tends to be stifled by too much study. \
    Finally, the pressure put on high school students by excessive schoolwork can cause \
    serious stress, which is unhealthy physically and mentally. I do not advocate the \
    elimination of schoolwork. I do think, however, that a reduction of the current heavy \
    load would be beneficial to students and to the society as a whole   In my opinion, the schoolwork now being assigned to high school \
    students is too heavy. While it is true that students need to study, \
    they need other things as well if they are to grow into healthy and \
    well-rounded adults. High school students should be allowed more time for play. \
    Playing is not wasting time, as some think. It gives them physical exercise, \
    and also exercises their imagination. Which tends to be stifled by too much study. \
    Finally, the pressure put on high school students by excessive schoolwork can cause \
    serious stress, which is unhealthy physically and mentally. I do not advocate the \
    elimination of schoolwork. I do think, however, that a reduction of the current heavy \
    load would be beneficial to students and to the society as a whole   In my opinion, the schoolwork now being assigned to high school \
    students is too heavy. While it is true that students need to study, \
    they need other things as well if they are to grow into healthy and \
    well-rounded adults. High school students should be allowed more time for play. \
    Playing is not wasting time, as some think. It gives them physical exercise, \
    and also exercises their imagination. Which tends to be stifled by too much study. \
    Finally, the pressure put on high school students by excessive schoolwork can cause \
    serious stress, which is unhealthy physically and mentally. I do not advocate the \
    elimination of schoolwork. I do think, however, that a reduction of the current heavy \
    load would be beneficial to students and to the society as a whole   In my opinion, the schoolwork now being assigned to high school \
    students is too heavy. While it is true that students need to study, \
    they need other things as well if they are to grow into healthy and \
    well-rounded adults. High school students should be allowed more time for play. \
    Playing is not wasting time, as some think. It gives them physical exercise, \
    and also exercises their imagination. Which tends to be stifled by too much study. \
    Finally, the pressure put on high school students by excessive schoolwork can cause \
    serious stress, which is unhealthy physically and mentally. I do not advocate the \
    elimination of schoolwork. I do think, however, that a reduction of the current heavy \
    load would be beneficial to students and to the society as a whole"
  }

  $scope.article = {
    title: contexts.title,
    content: contexts.content
  }
  $scope.QueryAnnounce = function () {
    return new Promise(function (resolve, reject) {
      var data = {
        page: 1,
        count: 1,
        filter: ''
      }
      $http.post('/auth/api/v1/mock/GetAnnouncementList', data).success(function (ret) {
        var total = ret.data.total;
        var datasets = ret.data.datasets
        if (datasets.length > 0) {
          setTimeout(() => {
            try {
              $scope.article.title = datasets[0].title
              $scope.article.content = datasets[0].content
              $scope.$digest()
            } catch (err) { }
          }, 0);

        }

      }).error(function (response) {
        console.log("fail")
        return reject(response.error)
      })
    })
  }
  $scope.QueryAnnounce()

}
