import jwt from 'jsonwebtoken'

export default (req, res, next) => {
  const { auth_token: token } = req.headers
  if (!token) return res.status(401).send('Unauthorized!')
  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET)
    req.user = verified
    next()
  } catch (error) {
    res.status(400).send('Access denied!')
  }
}
