const { Pool, Client } = require('pg')

const query = async (cmd, args) => {
	return new Promise((resolve, reject) => {
		const connection = new Pool()

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
