var express= require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var session = require('express-session');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

// database
mongoose.connect(process.env.MONGO_DB);
var db= mongoose.connection;
db.once("open", function(){
  console.log("DB connected!");
});
db.on("error", function(err){
  console.log("DB ERROR :", err);
});

//view engine
app.set("view engine", 'ejs');

//middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(flash());
app.use(session({secret:'MySecret'}));

//passport
var passport = require('./config/passport');
app.use(passport.initialize());
app.use(passport.session());

//routes
app.use('/', require('./routes/home')); //   / 에 도달하면 ./routes/home 개체를 사용하겠다라는 의미
app.use('/users', require('./routes/users')); //   /users 에 도달하면 ./routes/users 개체를 사용하겠다라는 의미
app.use('/posts', require('./routes/posts')); //   /posts 에 도달하면 ./routes/posts 개체를 사용하겠다라는 의미,
// 위에서 그 개체내에서의 라우트의 주소의 시작은 각각을 상대적 위치로 하여 / 으로 한다.
// 즉 /users에 유저가 도달하면(솔직히 어디서 출발하여 여기로 도달한 다는 것인 모르겠닼), routes/home 의 개체를 사용하겠다는 것같은데..
// 여튼, 여기에 도달하면, 불러들인 ./routes/home 파일은 그 내부에서 자신의 위치를 / 로 본다는 뭐 그런 내용.
// 그렇다 할지라도 ./routes/home (home.js 를 지칭하는 듯 js는 생략가능)에서 render를 하거나 redirect를 하는 경우에는
// 주소를 모두 다 써야 한다.




//start server
var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("Server On!");
});




//set routes
