var mongoose = require('mongoose');
//model settingR
var postSchema = mongoose.Schema({
  title: {type:String, required:true},
  body: {type:String, required:true},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user', required:true}, //mongoose.Schema.types.,ObjectId 라 써서 에러 났었음.
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date
});

var Post = mongoose.model('post', postSchema);

module.exports = Post;
