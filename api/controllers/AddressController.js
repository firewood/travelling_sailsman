/**
 * AddressController
 *
 * @description :: Server-side logic for managing addresses
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  create: function(req, res) {
    var lon = req.param('lon');
    var lat = req.param('lat');

    console.log("lon: " + lon + ", lat: " + lat);

//    lon = 139;
//    lat = 35;

    var endpoint = 'http://reverse.search.olp.yahooapis.jp/OpenLocalPlatform/V1/reverseGeoCoder';
    var appid = 'dj0zaiZpPXhjYW5JQkZNUkd0SiZzPWNvbnN1bWVyc2VjcmV0Jng9ZTA-';

    var parseXML = require('xml2js').parseString;
    var http = require('http');
    var url = endpoint + '?lon=' + lon + '&lat=' + lat + '&appid=' + appid;

    http.get(url, function(hres) {
      var body = '';
      hres.setEncoding('utf8');
      hres.on('data', function(chunk) {
        body += chunk;
      });
      hres.on('end', function(xres) {
        parseXML(body, {
          trim: true,
          explicitArray: false
        }, function (err, data) {
          if (!err && data.YDF && data.YDF.Feature && data.YDF.Feature.Property) {
            var address = data.YDF.Feature.Property.AddressElement;
            if (address && address.length >= 2) {
              var pref = address[0];
              var city = address[1];
              res.json({pref: pref, city: city});
              return;
            }
          }
          res.json({});
        });
      });
    }).on('error', function(e) {
      res.json({});
    });
  },

};
