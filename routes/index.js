var express = require('express');
var router = express.Router();
const {getNewLoginUrl} = require("./google-auth");
const { get } = require('./main');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render(' index', { title: 'Express' });
});

router.get('/test', async function (req, res, next) {
  const data = await getNewLoginUrl();
  const parsedUrl = data.config.url.replace(/\s/g, "");
  res.send(parsedUrl);
   

})

module.exports = router;
