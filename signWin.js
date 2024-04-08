const {
  execSync
} = require('node:child_process')

console.info(`signing with SignWin`)

exports.default = async configuration => {
  if (!process.env.SM_API_KEY) {
    console.info(`Skip signing because SM_API_KEY and  not configured`)
    return
  }

  if (!configuration.path) {
    throw new Error(`Path of application is not found`)
  }

  //signtool.exe sign /sha1 ${{ secrets.SM_CODE_SIGNING_CERT_SHA1_HASH }} /tr http://timestamp.digicert.com /td SHA256 /fd SHA256 "D:\a\OpenBuilds-CONTROL\OpenBuilds-CONTROL\dist\*.exe"
  //signtool.exe verify /v /pa "D:\a\OpenBuilds-CONTROL\OpenBuilds-CONTROL\dist\*.exe"

  execSync(`smctl sign --fingerprint="${process.env.SM_CODE_SIGNING_CERT_SHA1_HASH}" --input "${String(configuration.path)}"`, {
    stdio: 'inherit',
  })
  console.info(`signed with SignWin`)

}