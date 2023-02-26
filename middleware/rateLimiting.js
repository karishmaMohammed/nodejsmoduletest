const AccessModel = require("../models/AccessModel");

const rateLimiting = async (req, res, next) => {
  const sessionId = req.session.id;

  if (!sessionId) {
    return res.send({
      status: 400,
      message: "Invalid session, Please login again",
    });
  }

  //rate limiting logic

  //check if the user has access recently
  const sessionDb = await AccessModel.findOne({ sessionId: sessionId });

  console.log(sessionDb);

  //if sessionDb is not there, that means user is accessing the controller for the first time

  if (!sessionDb) {
    //create a new entry in the access model
    const accessTime = new AccessModel({
      sessionId: sessionId,
      time: Date.now(),
    });
    await accessTime.save();
    next();
    return;
  }

  //if the entry was there, then we need to compare the sessionDb.time
  const previousAccessTime = sessionDb.time;
  const currentTime = Date.now();

  console.log(currentTime - previousAccessTime);
  //1reuqest / 2 sec
  if (currentTime - previousAccessTime < 500) {
    console.log("here");
    return res.send({
      status: 401,
      message: "Too many request, Please try in some time",
    });
  }

  //allow the person to make the request by updating the the previous time to currenttime
  try {
    await AccessModel.findOneAndUpdate(
      { sessionId: sessionId },
      { time: Date.now() }
    );

    next();
  } catch (error) {
    return res.send({
      status: 400,
      message: "bad request",
      error: error,
    });
  }
};

module.exports = rateLimiting;