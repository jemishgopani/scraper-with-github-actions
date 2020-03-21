const fs = require('fs')
const readline = require('readline')
const { google } = require('googleapis')
const zipFolder = require('zip-a-folder')

const GoogleDrive = {
  SCOPES: ['https://www.googleapis.com/auth/drive'],
  TOKEN_PATH: 'token.json',
  CREDENTIALS_PATH: 'credentials.json',
  save: async () => {
    // Load client secrets from a local file.
    await fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err)
      // Authorize a client with credentials, then call the Google Drive API.
      GoogleDrive.authorize(JSON.parse(content), GoogleDrive.upload)
    })
  },
  authorize: (credentials, callback) => {
    const { client_secret, client_id, redirect_uris } = credentials.installed
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0])

    // Check if we have previously stored a token.
    fs.readFile(GoogleDrive.TOKEN_PATH, (err, token) => {
      if (err) return GoogleDrive.getAccessToken(oAuth2Client, callback)
      oAuth2Client.setCredentials(JSON.parse(token))
      callback(oAuth2Client)
    })
  },
  getAccessToken: (oAuth2Client, callback) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GoogleDrive.SCOPES
    })
    console.log('Authorize this app by visiting this url:', authUrl)
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close()
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return console.error('Error retrieving access token', err)
        oAuth2Client.setCredentials(token)
        // Store the token to disk for later program executions
        fs.writeFile(GoogleDrive.TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) return console.error(err)
          console.log('Token stored to', GoogleDrive.TOKEN_PATH)
        })
        callback(oAuth2Client)
      })
    })
  },
  upload: async (auth) => {
    const drive = google.drive('v3')
    const fileName = `${new Date().getTime()}.zip`
    zipFolder.zipFolder('collected_data', fileName, function (err) {
      if (err) {
        console.log('Something went wrong!', err)
      } else {
        const filesMetadata = {
          name: fileName,
          parents: ['1YpBKQa2zBF2_5nO_1fsCdtFr7INRGETo']
        }

        const media = {
          mimeType: 'application/zip',
          body: fs.createReadStream(fileName)
        }

        drive.files.create({
          auth: auth,
          resource: filesMetadata,
          media: media
        },
        (err, file) => {
          if (err) console.log(err)
          else {
            drive.permissions.create({
              auth: auth,
              fileId: file.data.id,
              requestBody: {
                role: 'reader',
                type: 'anyone'
              }
            })
            drive.files.get({
              auth: auth,
              fileId: file.data.id,
              fields: 'webViewLink'
            }).then(response => {
              send({
                text: `please visit on this ${response.data.webViewLink}`
              }, (error, result, fullResult) => {
                if (error) console.error(error)
                console.log(result)
              })
            })
          }
        })
      }
    })
  }
}

module.exports = GoogleDrive
