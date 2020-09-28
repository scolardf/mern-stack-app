const express = require('express');
const { connect } = require('mongoose');
const connectDB = require('./config/db');
const app = express();

//MONGODB CONNECTION
connectDB();

//Init middleware
app.use(express.json());

app.get('/', (req, res) => res.send('API running...'));

//Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
