"use strict";

const Assert = require('assert')
    , XML2JSON = require('xml2json')
    , Util = require('util')
    , Events = require('events')

class State {

  static get COMBATANT_TYPE_MONSTER() { return 'Monster' }
  static get COMBATANT_TYPE_PLAYER() { return 'Player' }

  constructor(obj) {
    this.encounterName = null
    this.currentCombatant = null
    this.currentActor = null
    this.currentRound = null
    this.combatants = []

    if(obj) {
      this.load(obj)
    }
  }

  load(obj) {
    var battle = obj || {}
    battle = battle.ActiveBattle || battle

    this.encounterName = battle.EncounterUsed
    this.currentCombatant = battle.CurrentCombatant
    this.currentActor = battle.CurrentActor
    this.currentRound = battle.RoundInfo

    this.combatants = []
    let combatants = battle.Combatants.Combatant;
    for(let i=0; i<combatants.length; i++) {
      let c = combatants[i];
      if(c.IsTurnToGo) {
        this.currentRoundTurn = i+1;
        this.currentCombatantIndex = i;
      }
      let actor = {
        name: c.Name,
        type: c.Type.toLowerCase(),
        isMonster: c.Type === State.COMBATANT_TYPE_MONSTER,
        isPlayer: c.Type === State.COMBATANT_TYPE_PLAYER,
        initiative: c.Initiative,
        size: c.Type === State.COMBATANT_TYPE_MONSTER ? c.MonsterSize : c.Size,
        class: c.Type === State.COMBATANT_TYPE_MONSTER ? c.MonsterClass : "Humanoid",
        label: c.CombatLabel,
        image: c.ImageUrl,
        hp: {
          max: c.MaxHitPoints,
          cur: c.CurrentHp,
          tmp: c.CurrentTempHp
        }
      }

      this.combatants.push(actor)
    }
    this.totalTurnsEnded = (combatants.length * this.currentRound) + this.currentRoundTurn - 2
    this.totalGameTimePassed = this.totalTurnsEnded * 6000
  }

  toString() {
    return Util.format('[Class State %j]', this)
  }

  static fromXML(xml) {
    if(!xml || !xml.constructor || xml.constructor !== String) {
      return new State()
    }

    let obj = XML2JSON.toJson(xml, {
      object: true,
      reversible: false,
      coerce: true,
      sanitize: true,
      trim: true,
      arrayNotation: false
    })

    return new State(obj)
  }
}


class Encounter extends Events.EventEmitter {

  constructor() {
    super()

    this.isActive = false
    this.state = null
  }

  beginBattle(newState) {
    this.state = newState
    this.isActive = true
    this.emit('begin', newState)
  }

  updateBattle(newState) {
    this.state = newState;
    this.emit('update', newState)
  }

  endBattle() {
    this.state = null;
    this.isActive = false
    this.emit('end')
  }

  cleanup() {
    this.endBattle()
  }

  toString() {
    return Util.format('[Class Encounter %j]', {isActive: this.isActive})
  }

}

class Session extends Events.EventEmitter {

  constructor(name) {
    super()
    this.name = name
    this.combat = new Encounter
    this.combat.on('begin', this.emit.bind(this, 'combat begin', this.combat))
    this.combat.on('update', this.emit.bind(this, 'combat update', this.combat))
    this.combat.on('end', this.emit.bind(this, 'combat end', this.combat))
  }

  update(newState) {
    let isActiveCombat = this.combat.isActive
    if(!isActiveCombat && newState) {
      this.combat.beginBattle(newState)
    } else if(isActiveCombat && (newState && newState.currentCombatant)) {
      this.combat.updateBattle(newState)
    } else if(isActiveCombat && (!newState || !newState.currentCombatant)) {
      this.combat.endBattle()
    } else {
      throw new Error('Unable to update state')
    }
  }

  cleanup() {
    if(this.combat.isActive) {
      this.combat.cleanup()
      this.combat.removeAllListeners()
    }
  }

  toString() {
    return Util.format('[Class Session %j]', {name: this.name})
  }
}

class SessionManager extends Events.EventEmitter {

  constructor() {
    super()
    this.sessions = new Map
  }

  get(name) {
    Assert(name, 'Name is required')
    let session = this.sessions.get(name)
    return session
  }

  create(name) {
    Assert(name, 'Name is required')
    if(this.sessions.has(name)) {
        this.delete(name);
    }

    let session = new Session(name)
    session.on('combat begin', this.emit.bind(this, 'session combat begin', session))
    session.on('combat update', this.emit.bind(this, 'session combat update', session))
    session.on('combat end', this.emit.bind(this, 'session combat end', session))


    this.sessions.set(name, session)
    return session
  }

  update(name, state) {
    let session = this.get(name)
    if(!session) {
      session = this.create(name);
    }
    Assert(session, 'Session does not exist')
    session.update(state)
  }

  delete(name) {
    let session = this.get(name)
    if(session) {
      session.cleanup()
      session.removeAllListeners()
      this.sessions.delete(name)
    }
  }
}


module.exports = (function() {
  const SINGLETON = new SessionManager
  return function() {
    return SINGLETON
  }
})()

module.exports.SessionManager = SessionManager
module.exports.Session = Session
module.exports.Encounter = Encounter
module.exports.State = State
