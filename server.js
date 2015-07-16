var express =           require('express')
    , http =            require('http')
    , path =            require('path')
    //, ImageResolver =   require('image-resolver')
    , bodyParser =   require('body-parser')
    , fs =           require('fs')
var crypto = require('crypto');


var app = module.exports = express();
app.use(express.static(path.join(__dirname, 'client')));
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

/*
var resolver = new ImageResolver();
resolver.register(new ImageResolver.FileExtension());
resolver.register(new ImageResolver.MimeType());
resolver.register(new ImageResolver.Opengraph());
resolver.register(new ImageResolver.Webpage());


app.post("/resolveImage", function(req, res) {
  var md5 = crypto.createHash('md5').update(req.body.url).digest('hex');

  if (fs.existsSync('./cache/'+md5+'.nex')) {
    res.json({ success: false});
    return;
  }
  if (fs.existsSync('./cache/'+md5+'.jpg')) {
    res.json({ success: true, url: "/cache/" + md5+'.jpg' });
    return;
  }
  resolver.resolve( req.body.url, function( result ){
    if ( result ) {
        res.json({ success: true, url: "/cache/" + md5+'.jpg' });
    } else {
        res.json({ success: false});
        fs.writeFileSync('./cache/'+md5+'.nex','');
    }
  });
});
*/

app.set('port', process.env.PORT || 8000);
app.set('host', process.env.LISTEN_HOST || null);
http.createServer(app).listen(app.get('port'), app.get('host'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
