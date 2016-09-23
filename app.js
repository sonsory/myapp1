//import modules
var express= require('express');
var path = require('path');
var app = express();
var mongoose = require('mongoose');
var passport = require('passport');
var session = require('express-session');
var flash = require('connect-flash');
var async = require('async');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

//connect database
// mongoose.connect('mongodb://asdf:qwer@ds021326.mlab.com:21326/bcode-test');

mongoose.connect(process.env.MONGO_DB);
var db= mongoose.connection;
db.once("open", function(){
  console.log("DB connected!");
});
db.on("error", function(err){
  console.log("DB ERROR :", err);
});

//model settingR
var postSchema = mongoose.Schema({
  title: {type:String, required:true},
  body: {type:String, required:true},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user', required:true}, //mongoose.Schema.types.,ObjectId 라 써서 에러 났었음.
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date
});

var Post = mongoose.model('post', postSchema);

var bcrypt = require("bcrypt-nodejs");

var userSchema = mongoose.Schema({
  email:{type:String, required:true, unique:true},
  nickname:{type:String, required:true, unique:true},
  password:{type:String, required:true},
  createdAt:{type:Date, default:Date.now}
});

userSchema.pre("save", function (next){
  var user = this;
  if(!user.isModified("password")){
    return next();
  } else {
    user.password = bcrypt.hashSync(user.password);
    return next();
  }
});

userSchema.methods.authenticate = function (password){
  var user = this;
  return bcrypt.compareSync(password, user.password);
};

userSchema.methods.hash = function (password){
  return bcrypt.hashSync(password);
};

var User = mongoose.model('user', userSchema);

//view setting
app.set("view engine", 'ejs');

//set middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(flash());

app.use(session({secret:'MySecret'}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done){
  done(null, user.id);
});
passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user){
    done(err, user);
  });
});

var LocalStrategy = require('passport-local').Strategy;
passport.use('local-login',
  new LocalStrategy({
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true
    },
    function(req, email, password, done){
      User.findOne({'email' : email}, function(err,user){
        if(err) return done(err);

        if(!user){
          req.flash("email", req.body.email);
          return done(null, false, req.flash('loginError', 'No user found.'));
        }
        if (!user.authenticate(password)){
          req.flash("email", req.body.email);
          return done(null, false, req.flash('loginError', 'password does not Match'));
        }
        return done(null, user);
      });
    }
  )
);

//set routes
  //set home route - root route
app.get('/', function(req, res){
  res.redirect('/posts');
});
app.get('/login', function(req, res){
  res.render('login/login', {email:req.flash("email")[0], loginError:req.flash('loginError')});
});
app.post('/login',
  function (req, res, next){
    req.flash("email"); //flash email data
    if(req.body.email.length === 0 || req.body.password.length ===0){
      req.flash("email", req.body.email);
      req.flash("loginError", "Please enter both email and password.");
      res.redirect('/login'); //req.redirect 라고 해서 에러났었음.
    } else {
      next();
    }
  }, passport.authenticate('local-login', {
    successRedirect : '/posts',
    failureRedirect : '/login',
    failureFlash : true
  })
);
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

//set user route
app.get('/users/new', function(req,res){
  res.render('users/new',{
                          formData: req.flash('formData')[0],
                          emailError: req.flash('emailError')[0],
                          nicknameError: req.flash('nicknameError')[0],
                          passwordError: req.flash('passwordError')[0]
                        }
  );
}); //new
app.post('/users', checkUserRegValidation, function(req, res, next){
  User.create(req.body.user, function (err, user){
    if(err) return res.json({success:false, message:err});
    res.redirect('/login');
  });
}); //create
app.get('/users/:id', isLoggedIn, function(req, res){
  User.findById(req.params.id, function (err,user){
    if(err) return res.json({success:false, message:err});
    res.render("users/show", {user: user});
  });
}); //show


app.get('/users/:id/edit', isLoggedIn, function(req,res){
  if(req.user._id != req.params.id) return res.json({success:false, message:"Unauthrized Attempt"});
  User.findById(req.params.id, function (err, user){
    if(err) return res.json({success:false, message:err});
    res.render("users/edit",{
                              user: user,
                              formData: req.flash('formData')[0],
                              emailError: req.flash('emailError')[0],
                              nicknameError: req.flash('nicknameError')[0],
                              passwordError: req.flash('passwordError')[0]
                            }
    );
  });
}); //edit

app.put('/users/:id',isLoggedIn, checkUserRegValidation, function(req, res){
  if(req.user._id != req.params.id) return res.json({success:false, message:"Unauthrized Attempt"});
  User.findById(req.params.id, req.body.user, function(err, user) {
    if(err) return res.json({success:"false", message:err});
    if(user.authenticate(req.body.user.password)) {
      if(req.body.user.newPassword){
        req.body.user.password = user.hash(req.body.user.newPassword);
      } else {
        delete req.body.user.password;
      }
      User.findByIdAndUpdate(req.params.id, req.body.user, function (err, user){ //User.findByIdUpdate 라고써서 에러났었음
        if(err) return res.json({success:"false", message:err});
        res.redirect('/users/'+req.params.id);
      });
    } else {
      req.flash("formData", req.body.user);
      req.flash("passwordError", "- Inavalid password");
      res.redirect('/user/'+req.params.id+"/edit");
    }
  });
}); //update

//set posts routes

app.get('/posts', function(req, res){
  //console.log("app.get : req_eventCount : ", req._eventCount);
  Post.find({}).populate("author").sort('-createdAt').exec(function (err, posts){
    if(err) return res.json({success:false, message:err});
    res.render("posts/index", {data:posts, user:req.user});
  });
}); //index

app.get('/posts/new', isLoggedIn, function(req, res){ // 여기서는 '/posts/new 로 하고..'
  console.log("app.js - app.get('/posts/new')");
  res.render("posts/new", {user:req.user});  //여기서는 "/posts/new" 로 하면 에러남. "posts/new"로 해야함.. why?
}); // new

app.post('/posts', isLoggedIn, function(req, res){
  console.log("app.js - app.post('/posts')", req.body.post);
   //req.body.post 는 콘솔에 body:'req.body.post 에 포함된 내용'  출력
  req.body.post.author=req.user._id;
  Post.create(req.body.post, function(err,post){
    if(err) return res.json({success:false, message:err}); // 에러가 난 뒤 다시 뒤로 돌아갈 수 있는 메누가 있었으면...
    res.redirect('/posts');
  });
}); //create


app.get('/posts/:id', function(req, res){
  console.log("app.js - app.get('/posts/:id') : req.body -" , req.body , " , res.body ", res.body);
  Post.findById(req.params.id, function(err, post){
    if(err) return res.json({success:false, message:err});
    res.render("posts/show",{data:post});
  });
});// show

app.get('/posts/:id/edit', function(req, res){
  console.log("app.js - app.get('/posts/:id/edit') : req.body -" , req.body , " , res.body ", res.body);
  Post.findById(req.params.id, function (err, post){
    if(err) return res.json({success:false, message:err});
    res.render("posts/edit", {data:post});
  });
});

app.put('/posts/:id', function(req, res){
  console.log("app.js - app.put('/posts/:id') : req.body -" , req.body , " , res.body ", res.body);
  req.body.post.updatedAt=Date.now(); // Insomnia 나 postman을 쓸때 아래의 양식대로 json을 쓰지 않으면 에러가 남.
  // {
  // 		"post" :{
  // 			"title": "Title Test reUpdated",
  // 			"body": "Body Test reUpdated"
  //
  // 		}
  // }
  Post.findByIdAndUpdate(req.params.id, req.body.post, function(err, post){
    if(err) return res.json({success:false, message:err});
    res.redirect('/posts/' +req.params.id);
    //res.json({success:true, message:post._id+" updated"});
  });
}); //update

app.delete('/posts/:id', function(req, res){
  console.log("app.js - app.delete('/posts/:id') : req.body -" , req.body , " , res.body ", res.body);
  Post.findByIdAndRemove(req.params.id, function(err, post){
    if(err) return res.json({success:false, message:err});
    res.redirect('/posts');
    //res.json({success:true, message:post._id+" deleted"});
  });
}); //destroy



//function
function isLoggedIn(req, res, next){
  if (req.isAuthenticated()){
    return next();
  }
  res.redirect('/');
}



function checkUserRegValidation(req, res, next){
  var isValid = true;

  async.waterfall(
    [function(callback){
      User.findOne({email: req.body.user.email, _id: {$ne: mongoose.Types.ObjectId(req.params.id)}},
        function(err, user){
          if(user){
            isValid = false;  //여기서 inValid 라고 오타를 쳐서 에러났음 ㅠㅠ 찾는데 꽤 걸림.
            req.flash("emailError", "- This email is already resistered.");
          }
          callback(null, isValid);
        }
      );
    }, function(isValid, callback){
      User.findOne({nickname: req.body.user.nickname, _id: {$ne: mongoose.Types.ObjectId(req.params.id)}},
          function(err, user){
            if(user){
              isValid = false;
              req.flash("nicknameError", "- This nickname is already resistered.");
            }
            callback(null, isValid);
          }
      );
    }], function (err, isValid){
      if(err) return res.json({success:"false", message:err});
      if(isValid){
        return next();
      } else {
        req.flash("formData", req.body.user);
        res.redirect("back");
      }
    }
  );
}


//start server
app.listen(3000, function(){
  console.log("Server On!");
});


//
// var dataSchema = mongoose.Schema({
//   name:String,
//   count:Number
// });
// var Data = mongoose.model('data', dataSchema);
// Data.findOne({name:"myData"}, function(err, data){
//   if(err) return console.log("Data ERROE:", err);
//   if(!data){
//     Data.create({name:"myData", count:0}, function (err, data){
//       if(err) return console.log("Data ERROR:", err);
//       console.log("Counter initialized :", data);
//     });
//   }
// });
//
//
//
// app.set('view engine', 'ejs');
// app.use(express.static(path.join(__dirname + '/public')));
//
// app.get('/', function (req,res){
//   Data.findOne({name:"myData"}, function(err,data){  //function에 data 인자는
//     if(err) return console.log("Data ERROR:", err); //모델을 담는 변수 Data가 아닌 1.문자열로 데이터 베이스에 연결될 collection의 단수 이름,,, 2 틀린생각 -그냥 function 안에서 쓰기위해 선언한 변수로 보는 것이 타당할 듯.
//     data.count++;
//     data.save(function(err){
//       if(err) return console.log("Data ERROR:", err);
//       res.render('my_first_ejs', data);
//     });
//   });
// });
//
//
// app.get('/reset', function(req, res){
//   setCounter(res, 0);
// });
// app.get('/set/count', function (req, res){
//   if(req.query.count) setCounter(res, req.query.counter);
//   else getCounter(res);
// });
// app.get('/set/:num', function (req, res){
//   if(req.params.num) setCounter(res, req.params.num);
//   else getCounter(res);
// });
//
// function setCounter(res, num){
//   console.log("setCounter");
//   Data.findOne({name:"myData"}, function(err, data){
//     if(err) return console.log("Data ERROR:", err);
//     data.count = num;
//     data.save(function (err){
//       if(err) return console.log("Data ERROR:", err);
//       res.render('my_first_ejs', data);
//     });
//   });
// }
// function getCounter(res){
//   console.log("getCounter");
//   Data.findOne({name:"myData"}, function (err, data){
//     if(err) return console.log("Data ERROR:", err);
//     res.render('my_first_ejs', data);
//   });
// }

// data.count=req.params.num;
// res.render('my_first_ejs', data);
//
//
// app.get('/', function(req, res){
//   res.render('my_first_ejs');
// });
