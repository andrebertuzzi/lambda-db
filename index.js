const { Pool } = require('pg')
const AWS = require('aws-sdk')

const connectionString = process.env.CONNECTION_STRING
let pool = null

const initializePool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: true,
    })
  }
}

const query = async (cmd, args) => {
  try {
    const results = await pool.query(cmd, args)
    return results
  } catch (err) {
    console.log('error ', JSON.stringify(err))
    // throw err
  }
}

exports.handler = async (event) => {
  initializePool() // Initialize the pool before processing SQS records
  if (Array.isArray(event.Records)) {
    console.log('SQS FLOW')
    const results = []
    for (const message of event.Records) {
      console.log('Body: ', message.body)
      const { cmd, args } = JSON.parse(message.body)
      const result = await query(cmd, args)
      results.push(result)
    }
    return results
  } else {
    console.log('DIRECT')
    console.log(event)
    const { cmd, args } = event
    return await query(cmd, args)
  }
}

if (process.env.NODE_ENV === 'local') {
  this.handler({
    cmd: 'select now()',
  })
}
