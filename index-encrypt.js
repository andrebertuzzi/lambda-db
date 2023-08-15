const { Pool } = require('pg')
const AWS = require('aws-sdk')

const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME
const encrypted = process.env.CONNECTION_STRING
let decrypted


const query = async (cmd, args, connectionString) => {
  console.log(cmd, args)
  const pool = new Pool({
    connectionString,
    ssl: true,
  })

  try {
    const results = await pool.query(cmd, args)
    return results
  } catch (err) {
    console.log('error ', JSON.stringify(err))
    // throw err
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
      // throw err
    }
  }
  if (Array.isArray(event.Records)) {
    console.log('SQS FLOW')
    // Event is an array of messages, for SQS trigger
    const results = []
    for (const message of event.Records) {
      console.log('Body: ', message.body)
      const { cmd, args } = JSON.parse(message.body)
      const result = await query(cmd, args, decrypted)
      results.push(result)
    }
    return results
  } else {
    console.log('DIRECT')
    console.log(event)
    // Event is an object, for direct invocation
    const { cmd, args } = event
    return await query(cmd, args, decrypted)
  }
}
