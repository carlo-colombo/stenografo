const speech = require('@google-cloud/speech')
const client = new speech.SpeechClient()

const tempfile = require('tempfile')
const runtimeConfig = require('cloud-functions-runtime-config')
const Api = require('microgram')

const Config = require('./config.js')

const config = new Config(runtimeConfig, 'telegram-bots', 'stenografo/prod')

exports.stenografo = function(req, res) {
  const {
    message: {
      chat: { id },
      voice
    }
  } = req.body

  if (voice == null) return res.send(200)
  if (voice.duration > 59) return res.send(200)

  try {
    return config
      .get('token', 'TELEGRAM_TOKEN')
      .then(token => new Api(token))
      .then(api =>
        api
          .getFile(voice.file_id)
          .then(require('download'))
          .then(file => file.toString('base64'))
          .then(content => ({
            config: {
              encoding: 'OGG_OPUS',
              sampleRateHertz: 16000,
              languageCode: 'it-IT'
            },
            audio: { content }
          }))
          .then(request => client.recognize(request))
          .then(data => {
            const response = data[0]
            const transcription = response.results
              .map(result => result.alternatives[0].transcript)
              .join('\n')
            console.log(`Transcription: `, transcription)
            return transcription
          })
          .then(text => api.sendMessage(id, `Trascritto: ${text}`))
          .then(response => res.send(response))
      )
      .catch(err => {
        console.error(err)
        return res.send({ error: err })
      })
  } catch (e) {
    console.log(e)
    res.send(e)
  }
}
