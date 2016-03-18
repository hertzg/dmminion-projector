const XML2JSON = require('xml2json')
    , FS = require('fs')


var xml = FS.readFileSync('./sample.xml', {encoding:'utf8'})
FS.writeFileSync('./sample.json', JSON.stringify(XML2JSON.toJson(xml, {
  object: true,
  reversible: false,
  coerce: true,
  sanitize: true,
  trim: true,
  arrayNotation: false
}), null, 2));
