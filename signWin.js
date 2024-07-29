const {
  execSync
} = require('node:child_process')

exports.default = async configuration => {
  if (!process.env.SM_API_KEY) {
    console.error("Signing using OpenBuilds CONTROL's custom signWin.js script: failed: SM_API_KEY ENV VAR NOT FOUND");
    return
  }

  if (!process.env.SM_CODE_SIGNING_CERT_SHA1_HASH) {
    console.error("Signing using OpenBuilds CONTROL's custom signWin.js script: failed: FINGERPRINT ENV VAR NOT FOUND");
    return
  }

  if (!configuration.path) {
    throw new Error(`Signing using OpenBuilds CONTROL's custom signWin.js script: failed: TARGET PATH NOT FOUND`)
    return
  }

  try {
    execSync(`smctl sign --fingerprint="${process.env.SM_CODE_SIGNING_CERT_SHA1_HASH}" --input "${String(configuration.path)}"`, {
      stdio: 'inherit',
    })
    console.log("Signing using OpenBuilds CONTROL's custom signWin.js script: successful");
  } catch (error) {
    console.error("Signing using OpenBuilds CONTROL's custom signWin.js script: failed:", error);
  }


}