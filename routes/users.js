import fs from 'fs'
import { Router } from 'express'
const router = Router()
import user from '../model/user.js'
import posts from '../model/posts.js'
import jwt from 'jsonwebtoken'
import bcryptjs from 'bcryptjs'
import verifyToken from '../auth/verifyToken.js'
import authRole from '../auth/authRole.js'

const getUser = async (req, res) => {
  try {
    const userInfo = await user.findOne(
      { _id: req.user._id },
      { _id: 0, __v: 0, password: 0 }
    )
    if (!userInfo) return res.status(403).send('No access')
    res.status(200).send(userInfo)
  } catch (error) {
    res.status(500).send(error)
  }
}
const loginUser = async (req, res) => {
  try {
    /*
     * TODO: remove getUser
     * save login info in redis
     * call this function for auto login as well
     * the apprach... check saved info or require login
     */
    const pipeline = [
      {
        $match: { username: req.body.username },
      },
      {
        $lookup: {
          from: 'posts',
          localField: '_id',
          foreignField: 'user_id',
          as: 'posts',
        },
      },
      {
        $project: { __v: 0, posts: { user_id: 0, __v: 0 } },
      },
    ]
    const findUser = await user.aggregate(pipeline)
    if (!findUser[0]) return res.status(400).send('User isn`t exist!')
    const a_user = findUser[0]
    // compare hash pass
    const validPass = await bcryptjs.compare(req.body.password, a_user.password)
    if (!validPass) return res.status(400).send('Wrong Password')
    // get jwt user auth
    const token = jwt.sign(
      { _id: a_user._id, role: a_user.role },
      process.env.TOKEN_SECRET,
      {
        expiresIn: 3600,
      }
    )
    const { username, email, role, date, posts } = a_user
    res
      .header('auth_token', token)
      .status(200)
      .json({
        user: { username, email, role, date },
        posts,
        msg: 'Welcome, ' + username,
      })
  } catch (error) {
    res.status(500).send(error)
  }
}
const addUser = async (req, res) => {
  try {
    const emailExist = await user.findOne({ email: req.body.email })
    if (emailExist) return res.status(400).send('email already in use!')

    const nameExists = await user.findOne({ username: req.body.username })
    if (nameExists) return res.status(400).send('username already in use!')
    // register new
    const isthereuser = await user.find()
    const { username, email } = req.body
    const salt = await bcryptjs.genSalt(10)
    const hashPass = await bcryptjs.hash(req.body.password, salt)
    const newUser = await user.create({
      username: username,
      email: email,
      password: hashPass,
      role: isthereuser == 0 ? 'ADMIN' : 'USER',
    })
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.TOKEN_SECRET,
      {
        expiresIn: 3600,
      }
    )
    res.status(201).header('auth_token', token).json({
      msg: 'User created!',
    })
  } catch (error) {
    res.status(500).send(error)
  }
}
const editUser = async (req, res) => {
  try {
    // TODO: req.user.user_id && username: req.body.username
    const editedUser = await user.updateOne(
      { _id: req.user._id },
      { $set: req.body }
    )
    if (editedUser.matchedCount === 0)
      return res.status(400).send('Action failed')
    res.status(200).send('Account edited')
  } catch (error) {
    res.status(500).send(error)
  }
}
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await user.deleteOne({
      _id: req.user._id,
      username: req.body.username,
    })
    if (deletedUser.deletedCount === 0)
      return res.status(400).send('Action failed')
    await posts.deleteMany({ user_id: req.user._id })
    res.status(200).send('User deleted')
  } catch (error) {
    res.status(500).send(error)
  }
}
// ************** ADMIN **************
const adminGETUsers = async (req, res) => {
  try {
    const allUsers = await user.find({})
    res.status(200).json(allUsers)
  } catch (error) {
    res.status(500).send(error)
  }
}
const adminDUser = async (req, res) => {
  try {
    const { id } = req.params
    await user.deleteOne({ _id: id })

    const all_posts = await posts.find({ user_id: id })
    await posts.deleteMany({ user_id: id })

    all_posts.forEach((p) => {
      console.log(p.image)
      fs.unlinkSync('frontend/public/images/' + p.image)
    })

    res.status(200).send('User deleted')
  } catch (error) {
    res.status(500).send(error)
  }
}
const userRole = async (req, res) => {
  try {
    const { userID, to_role } = req.query
    await user.updateOne({ _id: userID }, { $set: { role: to_role } })
    res.status(200).json({ msg: 'Promoted to ' + to_role, to_role })
  } catch (error) {
    res.status(500).send(error)
  }
}

router
  .get('/get-user', verifyToken, getUser)
  .post('/sign-in', loginUser)
  .post('/sign-up', addUser)
  .patch('/edit', verifyToken, editUser)
  .delete('/delete', verifyToken, deleteUser)
  // admin actions
  .get('/admin/all-users', verifyToken, authRole, adminGETUsers)
  .delete('/admin/delete/a-user/:id', verifyToken, authRole, adminDUser)
  .patch('/admin/role', verifyToken, authRole, userRole)

export default router
