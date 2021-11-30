import mongoose from 'mongoose'
const { Schema, model } = mongoose

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    min: 3,
    max: 10,
    unique: true,
  },
  role: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    min: 6,
  },
  date: {
    type: Date,
    default: new Date(),
  },
})
export default model('user', userSchema)
