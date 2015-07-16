(function() {

  io.socket.get('/message', function(messages) {
    for (var i = 0; i < messages.length; i++) {
      $('#chat-timeline').append('<li>' + messages[i].text + '</li>');
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

})();
