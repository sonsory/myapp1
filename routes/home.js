var express   = require('express');
var router    = express.Router();
var mongoose  = require('mongoose');
var passport  = require('../config/passport.js');

router.get('/', function(req, res){
res.redirect('/posts');
});
router.get('/login', function(req, res){
res.render('login/login', {email:req.flash("email")[0], loginError:req.flash('loginError'), loginMessage:req.flash('loginMessage')});
});
router.post('/login', passport.authenticate('local-login',{
  successRedirect : '/posts',
  failureRedirect : '/login',
  failureFlash : true
  })
);
router.get('/logout', function(req, res){
  req.logout();
  req.flash("postsMessage", "Good-bye, Have a nice day!");
  res.redirect('/');
});

router.get('/spink', function(req,res){ console.log("spink 페이지 접속"); // /new로 들어오면 호출되는 부분.
  res.render('users/spink',{    // res.render 의 경우 주소가 /없이 시작, res.redirect의 경우 주소가 /가 있고 시작.
                          formData: req.flash('formData')[0],
                          emailError: req.flash('emailError')[0],
                          nicknameError: req.flash('nicknameError')[0],
                          passwordError: req.flash('passwordError')[0]

                        }
  );
});


router.get('/spinksum', function(req,res){ console.log("spink 페이지 접속"); // /new로 들어오면 호출되는 부분.
  res.render('users/spinksum',{    // res.render 의 경우 주소가 /없이 시작, res.redirect의 경우 주소가 /가 있고 시작.
                          formData: req.flash('formData')[0],
                          emailError: req.flash('emailError')[0],
                          nicknameError: req.flash('nicknameError')[0],
                          passwordError: req.flash('passwordError')[0]

                        }
  );
});




module.exports = router;
