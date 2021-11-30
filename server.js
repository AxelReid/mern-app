import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import 'dotenv/config'
import userRoutes from './routes/users.js'
import postRoute from './routes/posts.js'
import fileUpload from 'express-fileupload'

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())

app.use('/user', userRoutes)
app.use(fileUpload())
app.use('/posts', postRoute)

const uri = process.env.DB_CONNECT
const port = process.env.PORT || 8000

const start = async () => {
  try {
    await mongoose.connect(uri)
    app.listen(port, () => console.log('Listening port ' + port))
  } catch (error) {
    console.log(error)
  }
}
start()
