var express   = require('express');
var router    = express.Router();
var mongoose  = require('mongoose');
var Post      = require('../models/Post');

router.get('/', function(req, res){
  //console.log("app.get : req_eventCount : ", req._eventCount);
  Post.find({}).populate("author").sort('-createdAt').exec(function (err, posts){
    if(err) return res.json({success:false, message:err});
    res.render("posts/index", {data:posts, user:req.user});
  });
}); //index

router.get('/new', isLoggedIn, function(req, res){ // 여기서는 '/posts/new 로 하고..'
  console.log("app.js - app.get('/posts/new')");
  res.render("posts/new", {user:req.user});  //여기서는 "/posts/new" 로 하면 에러남. "posts/new"로 해야함.. why?
}); // new

router.post('/', isLoggedIn, function(req, res){
  console.log("app.js - app.post('/posts')", req.body.post);
   //req.body.post 는 콘솔에 body:'req.body.post 에 포함된 내용'  출력
  req.body.post.author=req.user._id;
  Post.create(req.body.post, function(err,post){
    if(err) return res.json({success:false, message:err}); // 에러가 난 뒤 다시 뒤로 돌아갈 수 있는 메누가 있었으면...
    res.redirect('/posts');
  });
}); //create

router.get('/:id', function(req, res){
  console.log("app.js - app.get('/posts/:id') : req.body -" , req.body , " , res.body ", res.body);
  Post.findById(req.params.id).populate("author").exec(function(err, post){
    if(err) return res.json({success:false, message:err});
    res.render("posts/show",{data:post, user:req.user});
  });
});// show

router.get('/:id/edit', function(req, res){
  console.log("app.js - app.get('/posts/:id/edit') : req.body -" , req.body , " , res.body ", res.body);
  Post.findById(req.params.id, function (err, post){
    if(err) return res.json({success:false, message:err});
    res.render("posts/edit", {data:post});
  });
});

router.put('/:id', function(req, res){
  console.log("app.js - app.put('/posts/:id') : req.body -" , req.body , " , res.body ", res.body);
  req.body.post.updatedAt=Date.now(); // Insomnia 나 postman을 쓸때 아래의 양식대로 json을 쓰지 않으면 에러가 남.
  Post.findByIdAndUpdate(req.params.id, req.body.post, function(err, post){
    if(err) return res.json({success:false, message:err});
    res.redirect('/posts/' +req.params.id);
    //res.json({success:true, message:post._id+" updated"});
  });
}); //update

router.delete('/:id', function(req, res){
  console.log("app.js - app.delete('/posts/:id') : req.body -" , req.body , " , res.body ", res.body);
  Post.findByIdAndRemove(req.params.id, function(err, post){
    if(err) return res.json({success:false, message:err});
    if(!post) return res.json({success:false, message:"No data found to delete"});
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

module.exports = router;
