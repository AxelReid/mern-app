import mongoose from 'mongoose'
const { Schema, model } = mongoose

const postSchema = new Schema({
  user_id: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  comments: {
    type: Array,
    default: [],
  },
  date: {
    type: String,
    required: true,
  },
})

export default model('posts', postSchema)
