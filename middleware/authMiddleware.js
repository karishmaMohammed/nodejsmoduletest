const isAuth = (req, res, next) => {
    console.log(req.session);
    if(req.session.isAuth) {
        next();
    } else {
        return res.send({
            status: 405,
            message: "Invalid session, Please login again",
        });
    }
};

module.exports = { isAuth };