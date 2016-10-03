var express   = require('express');
var router    = express.Router();
var mongoose  = require('mongoose');
var Post      = require('../models/Post'); console.log("routes/posts 실행");
var Counter   = require('../models/Counter');
var async     = require('async');
var User      = require('../models/User');

router.get('/', function(req, res){ //console.log("app.get : req_eventCount : ", req._eventCount);
  var visitorCounter = null;
  var page = Math.max(1, req.query.page)>1?parseInt(req.query.page):1;
  var limit = Math.max(1, req.query.limit)>1?parseInt(req.query.page):10;
  var search = createSearch(req.query);

async.waterfall([function(callback){
  Counter.findOne({name:"visitors"}, function(err, counter){
    if(err) callback(err);
    visitorCounter = counter;
    callback(null);
  });
}, function(callback){
  if(!search.findUser) return callback(null);
  User.find(search.findUser, function(err, users){
    if(err) callback(err);
    var or = [];
    users.forEach(function(user){
      or.push({author:mongoose.Types.ObjectId(user._id)});
    });
    if(search.findPost.$or){
      search.findPost.$or = search.findPost.$or.concat(or);
    } else if (or.length>0){
      search.findPost = {$or:or};
    }
    callback(null);
  });
},function(callback){
  if(search.findUser && !search.findPost.$or) return callback(null, null, 0);
  Post.count(search.findPost, function(err, count){
    if(err) callback(err);
    skip = (page-1)*limit;
    maxPage = Math.ceil(count/limit);
    callback(null, skip, maxPage);
  });
}, function(skip, maxPage, callback){
  if(search.findUser && !search.findPost.$or) return callback(null, [],0);
    Post.find(search.findPost).populate("author").sort('-createdAt').skip(skip).limit(limit).exec(function (err, posts){
      if(err) callback(err);
      callback(null, posts, maxPage);
    });
  }], function (err, posts, maxPage){
    if(err) return res.json({success:false, message:err});
    return res.render("posts/index",{
      posts:posts, user:req.user, page:page, maxPage:maxPage,
      urlQuery:req._parsedUrl.query, search:search,
      counter:visitorCounter, postsMessage:req.flash("postsMessage")[0]
    });
  });
});
//index //posts:posts 에서 앞의 posts를 data로 써놨다가 -> views/posts/index.ejs 에서 <% posts.forEach(function(post){ %> 에러남
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
    res.render("posts/show", {post:post, urlQuery:req._parsedUrl.query, user:req.user, search:createSearch(req.query)}); //여기  post:post 에서 data:post로 되어 있어서, posts/show.ejs 에서 posts is not defined 에러뜸.
  }); //CHECK THE ERROR res.render에서 posts/show 로 search:createSearch(req.query)를 넘겨주는 부분을 깜빡하니, posts/show 에서 search is not defined 되었다고 에러남.
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


function createSearch(queries){
  var findPost = {}, findUser = null, highlight = {};
  if(queries.searchType && queries.searchText && queries.searchText.length >= 3){
    var searchType = queries.searchType.toLowerCase().split(",");
    var postQueries = [];
    if(searchType.indexOf("title")>=0){
      postQueries.push({title:{ $regex : new RegExp(queries.searchText, "i")}});
      highlight.title = queries.searchText;
    }
    if(searchType.indexOf("body")>=0){
      postQueries.push({body:{ $regex : new RegExp(queries.searchText, "i")}});
      highlight.body = queries.searchText;
    } // CHECK THE ERROR : new REgExp 라고 썼다가 검색창에 숫자넣으니 에러.
    if(searchType.indexOf("author!")>=0){
      findUser = {nickname : queries.searchText};
      highlight.author = queries.searchText;
    } else if (searchType.indexOf("author")>=0) {
      findUser = {nickname : {$regex : new RegExp(queries.searchText, "i")}};
      highlight.author = queries.searchText;
    }
    if(postQueries.length > 0) findPost = {$or:postQueries};
  }
  return { searchType : queries.searchType, searchText:queries.searchText,
    findPost:findPost, findUser:findUser, highlight:highlight };
}
