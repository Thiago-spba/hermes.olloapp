import dotenv from 'dotenv'
dotenv.config()

const GROQ_API_KEY = process.env.GROQ_API_KEY

export const transcribeAudio = async (audioBase64, mimeType = 'audio/webm') => {
  try {
    const audioBuffer = Buffer.from(audioBase64, 'base64')
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2)
    const ext = mimeType.includes('webm') ? 'webm' :
                mimeType.includes('mp4') ? 'mp4' :
                mimeType.includes('mp3') ? 'mp3' : 'webm'
    const filename = `audio.${ext}`

    const preamble = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${mimeType}\r\n\r\n`
    )

    const modelPart = Buffer.from(
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="model"\r\n\r\n` +
      `whisper-large-v3-turbo` +
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="language"\r\n\r\npt` +
      `\r\n--${boundary}\r\n` +
      `Content-Disposition: form-data; name="response_format"\r\n\r\njson` +
      `\r\n--${boundary}--\r\n`
    )

    const body = Buffer.concat([preamble, audioBuffer, modelPart])

    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString()
      },
      body,
      signal: AbortSignal.timeout(60000)
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Whisper Groq erro ${response.status}: ${err}`)
    }

    const data = await response.json()
    return data.text || ''

  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Tempo limite excedido na transcricao.')
    throw error
  }
}

export const checkWhisperHealth = async () => true