module.exports.command = 'synchrodata [project_url]'

module.exports.describe = 'Start a synchrodata unit.'

module.exports.builder = function(yargs) {
  var os = require('os')

  return yargs
    .env('STF_SYNCHRODATA')
    .strict()
    .option('project_url', {
      alias: 'pu'
    , describe: 'project_url'
    , type: 'string'
    , default: 'http://99.1.26.7:8012/Services/WebService.asmx?wsdl'

    })
    .epilog('')
}

module.exports.handler = function(argv) {
  console.log("handle synchrodata")
  return require('../../units/synchrodata')({
    project_url: argv.project_url
  })
}
