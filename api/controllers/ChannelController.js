/**
 * ChannelController
 *
 * @description :: Server-side logic for managing channels
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {

  create: function(req, res) {
    console.log("POST /thread");

    var name = req.param('name');

    Channel.findOne({ name: name }).exec(function(err, channel) {
      if (channel) {
        console.log('Channel found');
        res.json(channel);
      } else {
        Channel.create({ name: name }).exec(function(err, channel) {
          console.log('Channel created');

          if (req.isSocket) {
            Channel.publishCreate(channel, !req.options.mirror && req);
          }

          channel.new = 1;
          res.json(channel);
        });
      }
    });
  }

};

