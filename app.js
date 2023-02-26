const express = require("express");
const clc = require("cli-color");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);
const ObjectId = require("mongodb").ObjectId;
const jwt = require("jsonwebtoken");
const path = require("path")

//file imports
const { cleanUpAndValidate,  generateJWTToken, sendVerificationEmail } = require("./utils/AuthUtils");
const UserSchema = require("./UserSchema");
const { isAuth } = require("./middleware/authMiddleware");
//const rateLimiting = require("./middleware/rateLimiting");

const app = express();
const PORT = process.env.PORT || 8000;
const saltRound = 10;

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
mongoose.set("strictQuery", true);

//mongoDb connection
const MONGO_URI = `mongodb+srv://Karishma:Karishma@cluster0.iulkcqg.mongodb.net/TodoApp`
mongoose
  .connect(MONGO_URI)
  .then((res) => {
    console.log(clc.yellow("Connected to mongoDb"));
  })
  .catch((err) => {
    console.log(clc.red(err));
  });

//middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const store = new mongoDbSession({
  uri: MONGO_URI,
  collection: "sessions",
});

app.use(
  session({
    secret: "This is my Moduletest",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

//routes
app.get("/", (req, res) => {
  return res.send("This is Module Test")
})
app.get("/profile", (req, res) => {
  return res.render("profile");
});

app.get("/register", (req, res) => {
  return res.render("register");
});

app.get("/login", (req, res) => {
  return res.render("login");
});

app.post("/register", async (req, res)=>{
   
  const {name,username,email,password,phonenumber } = req.body;
  try{
      await cleanUpAndValidate({name,username,email,password,phonenumber});
  }
  catch(err){
      return res.send({
          status:400,
          message:err,
      })
  }

  // Hashing the Password
  const hashedPassword = await bcrypt.hash(password,10);


  // Instering the data into the Db
  let user = new UserSchema({
      name: name,
      username: username,
      email:email,
      phonenumber:phonenumber,
      password: hashedPassword,
      emailAuthenticated: false,
      });
      // console.log(user);
      
      let userExists;
      try{
          userExists = await UserSchema.findOne({ email })
      }
      catch(err){
          return res.send({
              status:400,
              message:"Internal Server Error. Please try again",
              error:err
          })
      }
      
      if(userExists){
          return res.send({
              status:400,
              message:"User Already Exists"
          })
      }
      
      // generating the token
      const verificationToken = generateJWTToken(email)
      try{
          const userDB = await user.save(); //Create a operations in DataBase. CRUD Operations
          // console.log(userDB);
      
          // send verification Email to user
      sendVerificationEmail(email, verificationToken)

          // res.redirect("/login");
          return res.send({
              status: 200,
              message:
                "Verification has been sent to your mail Id. Please verify before login",
              data: {
                _id: userDB._id,
                username: userDB.username,
                email: userDB.email,
              },
            });
  }
  catch(err){
      return res.send({
          status:400,
          message:"Internal Server Error, Please try again",
          error:err
          });
      }
  })

    

app.get("/verify/:id", async (req, res) => {
  console.log(req.params);
  const token = req.params.id;

  jwt.verify(token, "nodejsmoduletest", async (err, decodedData) => {
    if (err) throw err;
    console.log(decodedData);

    try {
      const userDb = await UserSchema.findOneAndUpdate(
        { email: decodedData.email },
        { emailAuthenticated: true }
      );

      console.log(userDb);
      if(userDb){
      return res.status(200).redirect("/login");
      }
    } catch (error) {
      return res.send({
        status: 400,
        message: "Invalid Authentication Link",
        error: error,
      });
    }
  });
  return res.status(200);
});

app.post("/login", async (req, res) => {
  
  const { loginId, password } = req.body;

  if (!loginId || !password) {
    return res.send({
      status: 400,
      message: "Missing credentials",
    });
  }

  if (typeof loginId !== "string" || typeof password !== "string") {
    return res.send({
      status: 400,
      message: "Invalid data format",
    });
  }

  //identify the loginId and searched in the DB
  let userDB;
  try {
   // let userDb;
    if (validator.isEmail(loginId)) {
      userDB = await UserSchema.findOne({ email: loginId });
    } else {
      userDB = await UserSchema.findOne({ username: loginId });
    }

    //if user is not present
    if (!userDB) {
      return res.send({
        status: 402,
        message: "UserId does not exsit",
      });
    }
    console.log(userDB);
    if (!userDB.emailAuthenticated) {
      return res.send({
        status: 400,
        message: "Please verify your email before login",
      });
    }

    //validate the password
    const isMatch = await bcrypt.compare(password, userDB.password);
    console.log(isMatch);
    if (!isMatch) {
      return res.send({
        status: 402,
        message: "Password does not match",
      });
    }

    req.session.isAuth = true;
    req.session.user = {
      username: userDB.username,
      email: userDB.email,
      userId: userDB._id,
    };

    return res.status(200).redirect("/profile");
  } catch (error) {
    return res.send({
      status: 401,
      message: "Data base error",
      error: error,
    });
  }
});

let user = []
    app.get("/profile", isAuth, async (req, res)=>{
    user = await UserSchema.findOne({username : req.session.user.username}) ;
    console.log(user)
    return res.render("profile",{user : user});


    })

app.listen(PORT, () => {
  console.log(clc.yellow("App is running at "));
  console.log(clc.blue.underline(`http://localhost:${PORT}`));
});


