var express = require('express');
var app = express();
var path = require('path')
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var config = require('./config.js');
// var hash = require('./hash');
var port = process.env.PORT || config.port; 
var hostname = config.hostname
app.set('superSecret', config.secret);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => {
    res.json("Hi");
});

app.post('/signup', (req, res) => {
    var form = req.body
    res.json(form);
});

app.listen(port, () => {
    console.log('Magic happens at http://localhost:' + port);
});