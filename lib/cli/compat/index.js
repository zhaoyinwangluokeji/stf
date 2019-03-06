module.exports.command = 'compat'

module.exports.describe = 'Start a compat unit.'

module.exports.builder = function(yargs) {
  var os = require('os')

  return yargs
    .env('STF_COMPAT')
    .strict()
    .option('max-file-size', {
      describe: 'Maximum file size to allow for uploads. Note that nginx ' +
        'may have a separate limit, meaning you should change both.'
    , type: 'number'
    , default: 1 * 1024 * 1024 * 1024
    })
    .option('port', {
      alias: 'p'
    , describe: 'The port to bind to.'
    , type: 'number'
    , default: process.env.PORT || 7100
    })
    .option('storage-url', {
      alias: 'r'
    , describe: 'URL to the storage unit.'
    , type: 'string'
    , demand: true
    })
    .epilog('Each option can be be overwritten with an environment variable ' +
      'by converting the option to uppercase, replacing dashes with ' +
      'underscores and prefixing it with `STF_COMPAT_` (e.g. ' +
      '`STF_COMPAT_SAVE_DIR`).')
}

module.exports.handler = function(argv) {
  console.log('.....................getting Compat...........')
  return require('../../units/compat/compat')({
    port: argv.port
  , storageUrl: argv.storageUrl
  , maxFileSize: argv.maxFileSize
  })
}
