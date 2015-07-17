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

      if (req.isSocket) {
        Message.subscribe(req, messages);
        if (req.options.autoWatch) {
          Message.watch(req);
        }
      }

      res.json(messages);
    });
  },

  create: function(req, res) {
    var text = req.param('text');
    Message.create({ text: text }).exec(function(err, message) {
      console.log('Message::create');

      if (req.isSocket) {
        Message.publishCreate(message, !req.options.mirror && req);
      }

      res.json(message);
    });
  }

};

