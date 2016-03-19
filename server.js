"use strict";

const Express = require('express')
    , BodyParser = require('body-parser')
    , HTTP = require('http')
    , SocketIO = require('socket.io')
    , QueryString = require('qs')
    , XML2JSON = require('xml2json')

const app = Express()
    , srv = HTTP.Server(app)
    , sio = SocketIO(srv)

const DM5E = require('./DM5E.js')
    , sessionManager = DM5E()


app.use(BodyParser.urlencoded({limit: '10mb', extended:true}))
app.post('/Data/:action', (req, res) => {
  let action = req.params.action
    , roomName = req.body.name
    , stateXML = req.body.data

  console.log('[DATA] Action "%s", Name: "%s", HasData:%s', action, roomName, !!stateXML)

  const ACTION_CREATE = 'create'
      , ACTION_UPDATE = 'update'
      , ACTION_DELETE = 'delete'

  switch(action.toLowerCase()) {
    case ACTION_CREATE :
      sessionManager.create(roomName)
      res.send('Success')
      break

    case ACTION_UPDATE :
      let stateObj = DM5E.State.fromXML(stateXML)
      sessionManager.update(roomName, stateObj)
      res.send('Success')
      break

    case ACTION_DELETE :
      sessionManager.delete(roomName)
      res.send('Success')
      break;

    default:
      res.status(400).send('Invalid action!')
  }

})
app.use('/www', Express.static('./www'))

sessionManager.on('session combat begin', (session, combat, state) => {
  console.log('session combat begin %s %s %s %s', arguments.length, session, combat, state)
  sio.emit('state', state)
})

sessionManager.on('session combat update', (session, combat, state) => {
  console.log('session combat update %s %s %s %s', arguments.length, session, combat, state)
  sio.emit('state', state)
})

sessionManager.on('session combat end', (session, combat, state) => {
  console.log('session combat end %s %s %s %s', arguments.length, session, combat, state)
  sio.emit('state', state)
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
