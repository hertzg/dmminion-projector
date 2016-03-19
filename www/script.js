function main() {

  var self = {};

  var modalDivEl = $('#loading')
    , titleEl = modalDivEl.find('h3.modal-title')
    , bodyEl = modalDivEl.find('div.modal-body')

  $('#loading').modal({backdrop: 'static', keyboard: false})

  setTimeout(function(){
    self.ws = wsConnect();
  }, 1000)

  function wsConnect() {
    var ws = io('/', {
      reconnection: true,
      reconnectionDelay: 100,
      reconnectionDelayMax: 1000,
      timeout: 5000,
      transports : ["websocket"]
    })

    ws.on('connect', onConnect)
    ws.on('error', console.log.bind(console, 'socket:error'))
    ws.on('disconnect', onDisconnect)
    ws.on('reconnect', console.log.bind(console, 'socket:reconnect'))
    ws.on('reconnect_attempt', onReconnectAttempt)
    ws.on('reconnecting', console.log.bind(console, 'socket:reconnecting'))
    ws.on('reconnect_error', console.log.bind(console, 'ws:reconnect_error'))
    ws.on('reconnect_failed', console.log.bind(console, 'ws:reconnect_failed'))
    ws.on('state', onStateMessage)
    return ws;
  }

  function onStateMessage(data) {
    var panelEl = $("#combatPanel")
      , panelTitleEl = panelEl.find('div.panel-title')
      , tableEl = panelEl.find('table')

    tableEl.find('tbody').children().remove()
    if(!data) {
      bodyEl.text('ველოდები ბრძოლას')
      $('#loading').modal('show')
      return;
    } else {
      $('#loading').modal('hide')
    }

    panelEl.find('div.panel-title').text(data.encounterName)
    panelEl.find('div.pull-right span.badge.elapsed').text(''+(data.totalGameTimePassed/1000)+'s')
    panelEl.find('div.pull-right span.badge.turns').text(''+data.totalTurnsEnded)
    panelEl.find('div.pull-right span.badge.rounds').text(''+data.currentRound)

    var playerRow = $(`
      <tr>
        <td class="init-ah success center"><span class="label label-success" style="line-height: 100px;font-size: 4em;"></span></td>
        <td>
          <div class="thumbnail pull-left" style="margin-bottom:0; margin-right: 15px;"><img src="" width="100px" height="100px;"/></div>
          <em class="name"></em>
        </td>
        <td class="hp center"><span class="label label-danger"></span></td>
      </tr>
    `)

    var enemyRow = $(`
      <tr>
        <td class="init-ah danger center"><span class="label label-danger" style="line-height: 100px;font-size: 4em;"></span></td>
        <td>
          <div class="thumbnail pull-left" style="margin-bottom:0; margin-right: 15px;"><img src="" width="100px" height="100px;"/></div>
          <em class="name"></em>
        </td>
        <td class="hp center"><span class="icon fa fa-battery-3"></span></td>
      </tr>
    `)

    var tpls = {
      player: playerRow,
      monster: enemyRow
    }

    var labelLevels = {
      0: 'label-danger',
      1: 'label-warning',
      2: 'label-success',
      3: 'label-success',
    }

    var batteryLevels = {
      '-1': 'fi-skull',
      0: 'fa fa-battery-0',
      1: 'fa fa-battery-1',
      2: 'fa fa-battery-2',
      3: 'fa fa-battery-3',
      4: 'fa fa-battery-4',
      5: 'fa fa-battery-4',
      6: 'fa fa-heart'
    }

    tableEl.find('tbody').children().remove()
    for(var i=0; i<data.combatants.length; i++) {
      var c = data.combatants[i]
      var newTpl = tpls[c.type].clone();

      if(i === data.currentCombatantIndex) {
        newTpl.removeClass().addClass('active')
      }

      newTpl.find('td.init-ah .label').text(c.initiative)
      newTpl.find('td div.thumbnail img').attr('src', c.image.replace('http://goatheadsoftware.com/application/5e/', 'images/'))
      newTpl.find('td em.name').text(c.name + ' - '+ c.size + ' - ' + c.class)


      if(c.type === 'player') {
        var delta = ~~(3*((((c.hp.cur+c.hp.tmp)/(c.hp.max+c.hp.tmp)))))
        newTpl.find('td.hp span.label').removeClass().addClass('label').addClass(labelLevels[delta]).text(c.hp.cur+'/'+c.hp.max)
      } else {
        if(c.hp.cur !== 0) {
          var delta = ~~(6*((((c.hp.cur+c.hp.tmp)/(c.hp.max+c.hp.tmp)))))
          newTpl.find('td.hp span.fa').removeClass().addClass('icon').addClass(batteryLevels[delta])
        } else {
          newTpl.find('td.hp span.fa').removeClass().addClass('icon').addClass(batteryLevels[-1])
        }
      }

      tableEl.find('tbody').append(newTpl)
    }
  }

  function onConnect() {
    bodyEl.text('დაკავშირებულია! ველოდები ბრძოლის დაწყებას')
  }

  function onReconnectAttempt(attemptNo) {
    bodyEl.text('ვცდილობ ხელახლა დავუკავშირდე.... (ცდა ნომერი #'+attemptNo+')')
  }

  function onDisconnect(reason) {
    bodyEl.text('კავშირი გაწყდა (მიზეზი: &quot;'+reason+'&quot;)')
    $('#loading').modal('show')
  }

}

$(document).ready(function(){
  main()
})
