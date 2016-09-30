var express   = require('express');
var router    = express.Router();
var mongoose  = require('mongoose');
var Post      = require('../models/Post'); console.log("routes/posts 실행");

router.get('/', function(req, res){ //console.log("app.get : req_eventCount : ", req._eventCount);
  var page = Math.max(1, req.query.page);
  var limit = 10;
  Post.count({}, function(err, count){
    if(err) return res.json({success:false, message:err});
    var skip = (page-1)*limit;
    var maxPage = Math.ceil(count/limit);
    Post.find().populate("author").sort('-createdAt').skip(skip).limit(limit).exec(function (err, posts){
      if(err) return res.json({success:false, message:err});
      res.render("posts/index", {
        posts:posts, user:req.user, page:page, maxPage:maxPage, postsMessage:req.flash("postsMessage")[0]});
     });
  });
}); //index //posts:posts 에서 앞의 posts를 data로 써놨다가 -> views/posts/index.ejs 에서 <% posts.forEach(function(post){ %> 에러남
router.get('/new', isLoggedIn, function(req, res){ // 여기서는 '/posts/new 로 하고..'
  res.render("posts/new", {user:req.user});  //여기서는 "/posts/new" 로 하면 에러남. "posts/new"로 해야함.. why?
});   console.log("app.js - app.get('/posts/new')"); // new
router.post('/', isLoggedIn, function(req, res){ console.log("app.js - app.post('/posts')", req.body.post);  //req.body.post 는 콘솔에 body:'req.body.post 에 포함된 내용'  출력
  req.body.post.author=req.user._id;
  Post.create(req.body.post, function(err,post){
    if(err) return res.json({success:false, message:err}); // 에러가 난 뒤 다시 뒤로 돌아갈 수 있는 메누가 있었으면...
    res.redirect('/posts');
  });
}); //create
router.get('/:id', function(req, res){ console.log("routes/posts 의 router.get /:id 호출 posts/show로 render");
    Post.findById(req.params.id).populate("author").exec(function(err, post){
    if(err) return res.json({success:false, message:err});
    res.render("posts/show", {post:post, page:req.query.page, user:req.user}); //여기  post:post 에서 data:post로 되어 있어서, posts/show.ejs 에서 posts is not defined 에러뜸.
  });
});// show
router.get('/:id/edit', isLoggedIn, function(req, res){  console.log("routes/posts 의 router.get /:id/edit 호출 posts/edit로 render");
  Post.findById(req.params.id, function (err, post){
    if(err) return res.json({success:false, message:err});
    if(!req.user._id.equals(post.author)) return res.json({success:false, message:"Unauthrized Attempt"});
    res.render("posts/edit", {post:post, user:req.user});
  });
}); // edit
router.put('/:id', isLoggedIn, function(req, res){  console.log("routes/posts 의 router.put 호출 posts +req.params.id 로 render");
  req.body.post.updatedAt=Date.now(); // Insomnia 나 postman을 쓸때 아래의 양식대로 json을 쓰지 않으면 에러가 남.
  Post.findOneAndUpdate({_id:req.params.id, author:req.user._id}, req.body.post, function(err, post) {
    if(err) return res.json({success:false, message:err});
    if(!post) return res.json({success:false, message:"No data found to update"});
    res.redirect('/posts/' +req.params.id); //Check the Error - '/posts' +req.params.id  에러남 -> '/posts/' +req.params.id로 /를 추가 해야함.
  });
}); //update
router.delete('/:id', isLoggedIn, function(req, res){ console.log("routes/posts 의 router.delete 호출 /posts 로 render");
  Post.findOneAndRemove({_id:req.params.id, author:req.user._id}, function(err, post){
    if(err) return res.json({success:false, message:err});
    if(!post) return res.json({success:false, message:"No data found to delete"});
    res.redirect('/posts');
  });
}); //destroy
function isLoggedIn(req, res, next){
  if (req.isAuthenticated()){
    return next();
  }
  console.log("isLoggedIn(req, res, next) 함수 실행, views/posts/index.ejs 로드됨");
  req.flash("postsMessage", "Please, Login First"); //postsMessage 의 posts 에서 s를 빼먹어서 views/posts/index.ej 에서   <%= postsMessage %>   is not defined 에러남 ,,
  res.redirect('/');
}

module.exports = router;
