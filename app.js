var express= require('express');
var app = express();
var path = require('path');
var mongoose = require('mongoose');
var session = require('express-session');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
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
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(flash());
app.use(session({secret:'MySecret'}));
app.use(countVisitors);

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

function countVisitors(req, res, next){
  if(!req.cookies.count && req.cookies['connect.sid']){
    res.cookie('count', "", {maxAge: 3600000, httpOnly: true});
    var now = new Date();
    var date= now.getFullYear() + "/" + now.getMonth() + "/" + now.getDate();
    if(date != req.cookies.countDate) {
      res.cookie("countDate", date, {maxAge: 86400000, httpOnly:true});

    var Counter = require('./models/Counter');
    Counter.findOne({name:"visitors"}, function(err, counter){
      if(err) return next();
      if(counter === null){
        Counter.create({name:"visitors",totalCount:1, todayCount:1, date:date});
      } else {
        counter.totalCount++;
        if(counter.date == date){
          counter.todayCount++;
        } else {
          counter.todayCount = 1;
          counter.date = date ;
        }
        counter.save();
      }
    });
  }
}
return next();
}





//set routes
