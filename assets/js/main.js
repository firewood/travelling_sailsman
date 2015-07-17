(function() {

  var currentChannel;

  function appendChannel(name) {
    $('#channels').append('<tr><td>' + name + '</td></tr>');
  }

  io.socket.get('/channel', function(channels) {
    for (var i = 0; i < channels.length; i++) {
      appendChannel(channels[i].name);
    }
  });

  io.socket.get('/message', function(messages) {
    for (var i = 0; i < messages.length; i++) {
      $('#chat-timeline').append('<li>' + messages[i].text + '</li>');
    }
  });

  io.socket.on('channel', function(channel) {
    if (channel.verb == 'created') {
      appendChannel(channel.data.name);
    }
  });

  io.socket.on('message', function(message) {
    if (message.verb == 'created') {
      $('#chat-timeline').append('<li>' + message.data.text + '</li>');
    }
  });

  $('#send-button').on('click', function() {
    var $text = $('#my-message');
    var msg = $text.val();
    console.log("msg: " + msg);

    io.socket.post("/message", {
      text: msg
    }, function(res) {
      $('#chat-timeline').append('<li>' + res.text + '</li>');
      $text.val('');
    });
  });


  $('#new-channel-button').on('click', function() {
    var $text = $('#channel-name');
    var name = $text.val();
    console.log("channel name: " + name);

    io.socket.post("/channel", {
      name: name
    }, function(res) {
      console.log("CHANNEL");
      console.log(res);

      if (res.new) {
        appendChannel(res.name);
      }

      currentChannel = res;
      $('#current-channel').text("Current channel: " + res.name);
      $text.val('');
    });
  });


  var map = new OpenLayers.Map("canvas");
  var mapnik = new OpenLayers.Layer.OSM();
  var zoom = 6;
  map.addLayer(mapnik);

  var proj4326 = new OpenLayers.Projection("EPSG:4326");
  var proj900913 = new OpenLayers.Projection("EPSG:900913");
  var lonLat = new OpenLayers.LonLat(135.00, 34.39).transform(proj4326, proj900913);
  map.setCenter(lonLat, zoom);

  OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
    initialize:function(options){
      OpenLayers.Control.prototype.initialize.apply(this, arguments);
      this.handler = new OpenLayers.Handler.Click(this, {'click':this.onClick, 'dblclick':this.onDblClick}, {'double':true});
    },
    onClick:function(e) {
      var rawLonLat = map.getLonLatFromPixel(e.xy);
      var lonlat = rawLonLat.clone().transform(proj900913, proj4326);
      onMapClick(lonlat.lon, lonlat.lat, rawLonLat);
    },
    onDblClick:function(e) {

    }
  });
  var click = new OpenLayers.Control.Click();
  map.addControl(click);
  click.activate();

  function onMapClick(lon, lat, rawLonLat) {
    console.log("lon: " + lon + ", lat: " + lat);

    io.socket.post("/address", { lon: lon, lat: lat }, function(res) {
      var pref = res.pref;
      var city = res.city;
      if (pref && city) {
        console.log("ADDRESS: " + pref.Name + ", " + city.Name);
      } else {
        console.log("Not found");
      }
    });

    findRakutenTravel(lon, lat);
  }

  function findRakutenTravel(lon, lat) {
    var radius = 3;   // 3.0 or less
    var rakuten_appid = '1016165842635314191';
    var endpoint = 'https://app.rakuten.co.jp/services/api/Travel/SimpleHotelSearch/20131024';
    var url = endpoint + '?formatVersion=2&datumType=1&applicationId=' + rakuten_appid + '&latitude=' + lat + '&longitude=' + lon + '&searchRadius=' + radius;
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json'
    }).done(function(data, status, xhr) {
      console.log("RAKUTEN");
      console.log(data);
    });
  }

})();
