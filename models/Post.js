var mongoose = require('mongoose');
//model settingR
var postSchema = mongoose.Schema({
  title: {type:String, required:true},
  body: {type:String, required:true},
  author: {type:mongoose.Schema.Types.ObjectId, ref:'user', required:true}, //mongoose.Schema.types.,ObjectId 라 써서 에러 났었음.
  views: {type:Number, default:0 },
  numId : {type:Number, required:true},  // CHECK THE ERROR -> 아래 참고 : 길어서 아래로 옮김
  comments : [{
    body: {type:String, required:true},
    author: {type:mongoose.Schema.Types.ObjectId, ref:'user', required:true},
    createdAt: {type:Date, default:Date.now}
  }],
  createdAt: {type:Date, default:Date.now},
  updatedAt: Date
});

postSchema.methods.getFormattedDate = function (date){
  return date.getFullYear() + "-" + get2digits(date.getMonth()+1) + "-" + get2digits(date.getDate());
};

postSchema.methods.getFormattedTime = function(date){
  var date = this.createdAt;
  return get2digits(date.getHours()) + ":" + get2digits(date.getMinutes())+ ":" + get2digits(date.getSeconds());
};
function get2digits(num){
  return ("0" + num).slice(-2);
}
var Post = mongoose.model('post', postSchema);

module.exports = Post;




//CHECK THE ERROR
//  numId : {type:Number, required:true},  에서 numId를 nunID로 오타냈다가 다음의 에러 나옴. 잘 보면(모르겠으면 아톰에서 ctrl +f 해서)보면 잘보임. numID를 요구, 스키마에 있는 값. 그러나 스키마가 오타,
//{"success":false,"message":{"message":"post validation failed","name":"ValidationError","errors":{"numID":{"message":"Path `numID` is required.","name":"ValidatorError","properties":{"type":"required","message":"Path `{PATH}` is required.","path":"numID"},"kind":"required","path":"numID"}}}}
