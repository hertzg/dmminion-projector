const Express = require('express')
    , BodyParser = require('body-parser')
    , HTTP = require('http')
    , SocketIO = require('socket.io')
    , QueryString = require('qs')
    , XML2JSON = require('xml2json')


const app = Express()
    , srv = HTTP.Server(app)
    , sio = SocketIO(srv)


app.use(BodyParser.urlencoded({extended:true}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/projector.html')
})

app.post('/Data/:action', (req, res) => {
  console.log('[DATA] Action "%s", Name: "%s", HasData:%s', req.params.action, req.body.name, !!req.body.data.length)
  res.send('Success')
})

srv.listen(80, () => {
  var addr = srv.address()
  console.log('[HTTP] Server listening on http://%s:%s', addr.address, addr.port)
})

/*
var Http = require('http');
var bl = require('bl');
var qs = require('qs');
var xml2json = require('xml2json');

var srv = Http.createServer((req, res) => {
  req.pipe(bl((err, buffer) => {
    var str = buffer.toString('utf8');
    if(str) {
      var xml = qs.parse(str).data;
      var obj = xml2json.toJson(xml || "", {
        object: true,
        reversible: false,
        coerce: true,
        sanitize: true,
        trim: true,
        arrayNotation: false
      })
    }
    console.log('%s %s HTTP %s - %j', req.method, req.url, req.httpVersion, obj)

    res.writeHead(200, {'Content-Type':'text/html'})
    res.end("Success");
  }))
});

srv.listen(80, () => {
  console.log("Server listening @ %j", srv.address())
})
*/
