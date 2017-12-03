var express = require('express');
var app = express();
var path = require('path')
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var config = require('./config.js');
var firebase = require('firebase');
var md5 = require('md5');
let configFirebase = {
    apiKey: "AIzaSyD9x7Be3e1So1bhvNFMfpq5XG6MDr81OLk",
    authDomain: "lungnoduledetection.firebaseapp.com",
    databaseURL: "https://lungnoduledetection.firebaseio.com",
    projectId: "lungnoduledetection",
    storageBucket: "lungnoduledetection.appspot.com",
    messagingSenderId: "791144749857"
};
const firebaseApp = firebase.initializeApp(configFirebase);
const db = firebaseApp.database();
// var hash = require('./hash');
var port = process.env.PORT || config.port; 
var hostname = config.hostname
app.set('superSecret', config.secret);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => {
    addUserInfo()
    res.json("Hi");
});

app.post('/signin', (req, res) => {
    var form = req.body
    firebase.auth().signInWithEmailAndPassword(form.email, form.password).then(
        user => {
            console.log('User authentication successful');
            const payload = {
                email: user.email,
            };
            var token = jwt.sign(payload, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            })
            res.json({
                success: true,
                message: 'Your accound has been loged in!',
                token: token
            });
        },
        err => {
            if (err.code === 'auth/wrong-password') {
                res.json({
                    success: false,
                    message: 'Wrong password',
                });
            } else if (err.code === 'auth/user-not-found') {
                res.json({
                    success: false,
                    message: 'User not found!',
                });
            } else if (err.code === 'auth/invalid-email') {
                res.json({
                    success: false,
                    message: 'Invalid email',
                });
            } else {
                res.json({
                    success: false,
                    message: 'Oops. ' + err.message
                });
            }
        }
    ).catch (error => {
        if (error.code === 'auth/wrong-password') {
            res.json({
                success: false,
                message: 'Wrong password',
            });
        } else {
            res.json({
                success: false,
                message: error.message,
            });
        }
    })
})

app.post('/signup', (req, res) => {
    var form = req.body
    firebase.auth().createUserWithEmailAndPassword(form.email, form.password).then( 
        user => {
            var newUser = {
                email: form.email,
                fname: form.fname,
                lname: form.lname,
                idcard: form.idcard,
                gender: form.gender,
                department: form.department,
                pid: form.pid,
                hospital: form.hospital
            }
            var uid = md5(form.email)
            console.log(uid);
            db.ref('users/'+ uid).set(newUser)
            console.log('Your accound has been created!')
            res.json({
                success: true,
                message: 'Your accound has been created!',
            });
        }, 
        error => {
            var errorCode = error.code
            var errorMsg = error.message
            if (errorCode == 'auth/weak-password') {
                res.json({
                    success: false,
                    message: 'The password is too wee',
                });
            } else {
                res.json({
                    success: false,
                    message: 'Oops.' + errorMsg,
                });
            }
        }
    )
})

app.use(function(req, res, next) {
    // if token is valid, continue to the specified sensitive route
    // if token is NOT valid, return error message
    // read a token from body or urlencoded or header (key = x-access-token)
    var token = req.body.token || req.query.token || req.headers['x-access-token'] // || req.cookies.auth;
    
    if (token) {
        jwt.verify(token, config.secret, function(err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Invalid token.'
                });
            } else {
                req.decoded = decoded; // add decoded token to request obj.
                next(); // continue to the sensitive route
            }
        });
    } else {
        res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});

app.get('/test', (req, res) => {
    res.json("EiEi");
});

app.listen(port, () => {
    console.log('Magic happens at http://localhost:' + port);
});

