(function() {

  var currentChannel;

  var crafts = {};
  for (var i = 0; i < crafts_flat.length; ++i) {
    var c = crafts_flat[i];
    if (!crafts[c[0]]) {
      crafts[c[0]] = [];
    }
    crafts[c[0]].push(c[1]);
  }
//  console.log(crafts);

  var machiraku = {};
  for (var i = 0; i < machiraku_flat.length; ++i) {
    var m = machiraku_flat[i];
    machiraku[m[0]] = m[1];
  }

/*
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
*/

  function back_to_top() {
    large = 1;
    map.setCenter(default_lonLat, default_zoom);
  }

  var large = 1;
  var map = new OpenLayers.Map("canvas");
  var mapnik = new OpenLayers.Layer.OSM();
  map.addLayer(mapnik);

  var proj4326 = new OpenLayers.Projection("EPSG:4326");
  var proj900913 = new OpenLayers.Projection("EPSG:900913");
  var default_lonLat = new OpenLayers.LonLat(137.00, 35.5).transform(proj4326, proj900913);
  var default_zoom = 6;
  back_to_top();

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

  var ViewModel = {
    pref: ko.observable(''),
    city: ko.observable(''),
    pref_link: ko.observable(''),
    city_link: ko.observable(''),
    crafts: ko.observableArray([]),
    ichibas: ko.observableArray([]),
    travels: ko.observableArray([]),
    machiraku: ko.observable(''),
    onCraftClick: function(data) {
      console.log("CRAFT");
      console.log(data);
      findRakutenIchiba(data);
    }
  };

  ko.applyBindings(ViewModel);

  function shrinkMap(pref, city, lonlat) {
    console.log("ADDRESS: " + pref.Name + ", " + city.Name);
    if (large) {
      large = 0;
      $('#canvas').animate({
            width: '640px',
            height: '480px'
      }, 1000)
      .promise().done(function() {
        map.updateSize();
        map.setCenter(lonlat, 10);
        $('.contents').toggleClass("hide");
      });
    } else {
      map.setCenter(lonlat, 10);
    }

    var google = 'https://www.google.co.jp/search?q=';
    ViewModel.pref(pref.Name);
    ViewModel.city(city.Name);
    ViewModel.pref_link(google + pref.Name);
    ViewModel.city_link(google + pref.Name + city.Name);

    var machiraku_link = machiraku[pref.Name];
    ViewModel.machiraku(machiraku_link ? machiraku_link : '');

    ViewModel.crafts.removeAll();
    var arr = crafts[pref.Name];
    if (arr.length) {
      for (var i = 0; i < arr.length; ++i) {
        ViewModel.crafts.push(arr[i]);
      }
    }
  }

  function onMapClick(lon, lat, rawLonLat) {
    console.log("lon: " + lon + ", lat: " + lat);

    io.socket.post("/address", { lon: lon, lat: lat }, function(res) {
      var pref = res.pref;
      var city = res.city;
      if (pref && city) {
        shrinkMap(pref, city, rawLonLat);
      } else {
        console.log("Not found");
      }
    });

    findRakutenTravel(lon, lat);
  }

  function findRakutenIchiba(keyword) {
    var rakuten_appid = '1016165842635314191';
    var endpoint = 'https://app.rakuten.co.jp/services/api/IchibaItem/Search/20140222';
    var url = endpoint + '?formatVersion=2&applicationId=' + rakuten_appid + '&keyword=' + keyword;
    $.ajax({
      url: url,
      type: 'GET',
      dataType: 'json'
    }).done(function(data, status, xhr) {
      ViewModel.ichibas.removeAll();
      var items = data.Items;
      if (items) {
        var remain = 5;
        for (var i = 0; i < items.length; ++i) {
          var item = items[i];
          console.log(item);
          if (item.imageFlag == 1) {
            ViewModel.ichibas.push(item);
            if (--remain <= 0) {
              break;
            }
          }
        }
      }
    });
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
      console.log("TRAVEL");
      console.log(data);

      ViewModel.travels.removeAll();
      var items = data.hotels;
      if (items) {
        var remain = 5;
        for (var i = 0; i < items.length; ++i) {
          var item = items[i];
          console.log(item);

          var extra = item[1].hotelRatingInfo;
          var rating = '';
          if (extra && extra.serviceAverage) {
            rating = '☆ ' + extra.serviceAverage;
          }
          item[0].rating = rating;

          ViewModel.travels.push(item);
          if (--remain <= 0) {
            break;
          }
        }
      }
    });
  }

  $('#back_to_top').click(function() {
    if (!large) {
      $('.contents').toggleClass("hide");

      $('#canvas').animate({
        width: '1024px',
        height: '1024px'
      }, 1000)
      .promise().done(function() {
        map.updateSize();
        back_to_top();
      });
    }
  });

})();
