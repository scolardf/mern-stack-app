const mongoose = require('mongoose');
const config = require('config');
const dbURI = config.get('mongoURI');

const connectDB = async () => {
	try {
		await mongoose.connect(dbURI, {
			useNewUrlParser: true,
			useCreateIndex: true,
			useFindAndModify: false,
			useUnifiedTopology: true,
		});

		console.log('MongoDB connected...');
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
};

module.exports = connectDB;
