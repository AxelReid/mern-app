import fs from 'fs'
import { Router } from 'express'
import verifyToken from '../auth/verifyToken.js'
const router = Router()
import posts from '../model/posts.js'
import user from '../model/user.js'
import authRole from '../auth/authRole.js'

const getPosts = async (req, res) => {
  try {
    const userExists = await user.findOne({ _id: req.user._id })
    if (!userExists)
      return res.status(400).send('Couldn`t get a post for unknown user')
    const allPosts = await posts
      .find({ user_id: req.user._id }, { __v: 0, user_id: 0 })
      .sort({ date: -1 })
    res.status(200).send(allPosts)
  } catch (error) {
    res.status(500).send(error)
  }
}
const addPost = async (req, res) => {
  try {
    if (req.files) {
      const userExist = await user.findOne({ _id: req.user._id })
      if (userExist) {
        const { image } = req.files
        const img_name =
          new Date().getTime() + '.' + image.mimetype.split('/')[1]
        await image.mv(`frontend/public/images/${img_name}`)
        const post = await posts.create({
          ...req.body,
          user_id: req.user._id,
          image: img_name,
          date: new Date().toLocaleString(),
        })
        return res.status(201).json({
          post,
          msg: 'New post added!',
        })
      }
    }
    res.status(400).send('unknown user attemped to create a post')
  } catch (error) {
    res.status(500).send(error)
  }
}
const editPost = async (req, res) => {
  const { _id, title, text } = req.body

  try {
    if (req.files !== null) {
      const the_post = await posts.findOne({ _id: _id })
      const img_path = 'frontend/public/images/' + the_post.image
      fs.unlinkSync(img_path)

      const { image } = req.files
      const img_name =
        the_post.image.split('.')[0] + '.' + image.mimetype.split('/')[1]
      await image.mv(`frontend/public/images/${img_name}`)

      const edited_with_img = await posts.updateOne(
        { user_id: req.user._id, _id: _id },
        { $set: { image: img_name, title: title, text: text } }
      )
      if (edited_with_img !== 0) {
        return res.status(200).json({ msg: 'post edited' })
      }
    } else {
      const edited = await posts.updateOne(
        { user_id: req.user._id, _id: _id },
        { $set: { title: title, text: text } }
      )
      const { modifiedCount } = edited
      if (modifiedCount !== 0) {
        return res.status(200).json({ msg: 'post edited' })
      }
    }
    res.status(400).send('couldn`t edit')
  } catch (error) {
    res.status(500).send(error)
  }
}
const deletePost = async (req, res) => {
  try {
    const { id } = req.params

    const img = id.split('-&-')[0]
    const ID = id.split('-&-')[1]

    const deleted = await posts.deleteOne({ _id: ID, user_id: req.user._id })
    const { deletedCount } = deleted
    if (deletedCount !== 0) {
      const img_path = 'frontend/public/images/' + img
      fs.unlinkSync(img_path)
      return res.status(200).json({ msg: 'post deleted' })
    }
    res.status(400).send('couldn`t delete')
  } catch (error) {
    res.status(500).send(error)
  }
}

const adminGETPosts = async (req, res) => {
  try {
    const { id } = req.params
    const user_posts = await posts.find({ user_id: id }, { __v: 0, user_id: 0 })
    res.status(200).json({ posts: user_posts })
  } catch (error) {
    res.status(500).send(error)
  }
}

router
  .get('/get', verifyToken, getPosts)
  .post('/add', verifyToken, addPost)
  .patch('/edit/:id', verifyToken, editPost)
  .delete('/delete/:id', verifyToken, deletePost)
  // admin actions
  .get('/admin/user-posts/:id', verifyToken, authRole, adminGETPosts)

export default router
