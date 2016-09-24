var express   = require('express');
var router    = express.Router();
var mongoose  = require('mongoose');
var User      = require('../models/User');
var async     = require('async');

//set user route
router.get('/new', function(req,res){
  res.render('users/new',{
                          formData: req.flash('formData')[0],
                          emailError: req.flash('emailError')[0],
                          nicknameError: req.flash('nicknameError')[0],
                          passwordError: req.flash('passwordError')[0]
                        }
  );
}); //new
router.post('/users', checkUserRegValidation, function(req, res, next){
  User.create(req.body.user, function (err, user){
    if(err) return res.json({success:false, message:err});
    res.redirect('/login');
  });
}); //create
router.get('/users/:id', isLoggedIn, function(req, res){
  User.findById(req.params.id, function (err,user){
    if(err) return res.json({success:false, message:err});
    res.render("users/show", {user: user});
  });
}); //show


router.get('/users/:id/edit', isLoggedIn, function(req,res){
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

router.put('/users/:id',isLoggedIn, checkUserRegValidation, function(req, res){
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


module.exports = router;