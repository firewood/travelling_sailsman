/**
 * MessageController
 *
 * @description :: Server-side logic for managing messages
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  find: function(req, res) {
    Message.find().exec(function(err, messages) {
      console.log('Message::find');

      Message.subscribe(req, messages);
      if (req.options.autoWatch) {
        Message.watch(req);
      }

      res.json(messages);
    });
  },

  create: function(req, res) {
    var text = req.param('text');
    Message.create({ text: text }).exec(function(err, message) {
      console.log('Message::create');

      Message.publishCreate(message, !req.options.mirror && req);

      res.json(message);
    });
  }

};

