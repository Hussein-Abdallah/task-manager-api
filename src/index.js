// const path = require('path')
// require('dotenv').config({ path: path.join(__dirname, '../config/.env') });
const express = require('express');
const mongoose = require('mongoose')
require('./db/mongoose.js');

console.log();
// require app routers
const userRouter = require('./routers/user.js')
const taskRouter = require('./routers/task.js')

const app = express()

// for parsing application/json
app.use(express.json())
// for using user routers
app.use(userRouter)
// for using task routers
app.use(taskRouter)

app.listen(process.env.PORT, () => {
    console.log(`Server is up and running on ${process.env.PORT}`);
})

