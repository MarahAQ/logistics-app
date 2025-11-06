// Temporary middleware - we'll implement authentication later
const authMiddleware = (req, res, next) => {
  console.log('Auth middleware - will implement later');
  next();
};

module.exports = authMiddleware;
