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


})();
