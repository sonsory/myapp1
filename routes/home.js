var express   = require('express');
var router    = express.Router();
var mongoose  = require('mongoose');
var passport  = require('../config/passport.js');

//set home route - root route
router.get('/', function(req, res){
res.redirect('/posts');
});
router.get('/login', function(req, res){
res.render('login/login', {email:req.flash("email")[0], loginError:req.flash('loginError')});
});
router.post('/login',
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
router.get('/logout', function(req, res){
req.logout();
res.redirect('/');
});

module.exports = router;
