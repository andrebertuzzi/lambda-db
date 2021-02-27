const { Pool, Client } = require('pg')

const query = async (cmd, args) => {
	return new Promise((resolve, reject) => {
		const connection = new Pool({
			host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DBNAME,
			user: process.env.POSTGRES_USER,
			password: process.env.POSTGRES_PASSWORD,
		})

		console.log('connection created - going to connect ')

		connection.query(cmd, args, (err, results) => {
			console.log('query was ran')
			connection.end((ef) => {
				if (ef) {
					console.log('connection end fails ', JSON.stringify(ef))
				}
				if (err) {
					console.log('error ', JSON.stringify(err))
					reject(err)
				} else {
					console.log('data ', JSON.stringify(results))
					resolve(results)
				}
			})
		})
	})
}

exports.handler = async (event) => {
	return query(event.command, event.args)
}
