export default (req, res, next) => {
  try {
    if (req.user.role === 'ADMIN') {
      next()
    }
  } catch (error) {
    res.status(401).send('Not allowed')
  }
}
