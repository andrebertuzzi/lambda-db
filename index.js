const { Pool } = require('pg')
const AWS = require('aws-sdk')
AWS.config.update({ region: 'sa-east-1' })

const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME
const encrypted = process.env.CONNECTION_STRING
let decrypted


const query = async (event, connectionString) => {
  const cmd = event.cmd
  const args = event.args

  console.log(connectionString, cmd, args)
  const pool = new Pool({
    connectionString,
  })

  try {
    const results = await pool.query(cmd, args)
    console.log('query was ran')
    console.log('data ', JSON.stringify(results))
    return results
  } catch (err) {
    console.log('error ', JSON.stringify(err))
    throw err
  } finally {
    await pool.end()
  }
}

exports.handler = async (event) => {
  if (!decrypted) {
    // Decrypt code should run once and variables stored outside of the
    // function handler so that these are decrypted once per container
    const kms = new AWS.KMS()
    try {
      const req = {
        CiphertextBlob: Buffer.from(encrypted, 'base64'),
        EncryptionContext: { LambdaFunctionName: functionName },
      }
      const data = await kms.decrypt(req).promise()
      decrypted = data.Plaintext.toString('ascii')
    } catch (err) {
      console.log('Decrypt error:', err)
      throw err
    }
  }
  return await query(event, decrypted)
}
