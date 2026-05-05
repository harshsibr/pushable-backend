const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next)=>{
    const Header = req.headers.authorization;
    if(!Header || !Header.startsWith('Bearer ')){
        res.send({message:"Authentication Invalid"});
    }
    const token = Header.split(' ')[1];
    try {
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decode;
   } catch (err) {
        res.send({message:"Invalid Token"});
    }
    return next();
};

module.exports = verifyToken;