var express =           require('express')
    , http =            require('http')
    , path =            require('path')

    
var app = module.exports = express();
app.use(express.static(path.join(__dirname, 'client')));


app.set('port', process.env.PORT || 8000);
app.set('host', process.env.LISTEN_HOST || null);
http.createServer(app).listen(app.get('port'), app.get('host'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
