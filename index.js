var express = require('express');
var app = express();
var path = require('path')
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var config = require('./config.js');
var firebase = require('firebase');
var md5 = require('md5');
var cors = require('cors');
var fetch = require('node-fetch');
var axios = require('axios');
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
// var hostname = config.hostname
app.set('superSecret', config.secret);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors())

app.get('/', (req, res) => {
    // addUserInfo()
    res.json("Hi");
});

app.post('/signin', (req, res) => {
    var form = req.body
    var Ref = firebase.database().ref("users/");
    firebase.auth().signInWithEmailAndPassword(form.email, form.password).then(
        user => {
            console.log('User authentication successful');
            Ref.orderByChild("email").equalTo(user.email).on("child_added", function(data) {
                var usertable = data.val();
                // console.log(usertable.fname)
                const payload = {
                    email: user.email,
                };
                var token = jwt.sign(payload, config.secret, {
                    expiresIn: 86400 // expires in 24 hours
                })
                res.json({
                    success: true,
                    message: 'Your accound has been loged in!',
                    token: token,
                    name : usertable.fname
                });
            }, function (error) {
                res.json("Error: " + error.code)
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

            const payload = {
                email: user.email,
            };
            var token = jwt.sign(payload, config.secret, {
                expiresIn: 86400 // expires in 24 hours
            })

            res.json({
                success: true,
                message: 'Your accound has been created!',
                token: token,
                name : form.fname
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
    var token = req.body.token || req.query.token || req.headers['x-access-token'] 
    if (token) {
        jwt.verify(token, config.secret, function(err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Invalid token.'
                });
            } else {
                req.decoded = decoded; 
                next();
            }
        });
    } else {
        res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});

app.get('/usertable', (req, res) => {
    emailUser = req.decoded
    
    var Ref = firebase.database().ref("users/");

    Ref.orderByChild("email").equalTo(emailUser.email).on("child_added", function(data) {
        var usertable = data.val();
        console.log(usertable)
        res.json(usertable.table)
    }, function (error) {
        res.json("Error: " + error.code)
    });
});

app.post('/addtable', (req, res) => {
    var form = req.body
    var emailUser = req.decoded
    var Ref = firebase.database().ref("users/");
    Ref.orderByChild("email").equalTo(emailUser.email).once("value", function(data) {
        var userKey
        for (let key in data.val()) {
            userKey = key
            break
        }
        var newData = {
            name: form.name,
            gender: form.gender,
            age: form.age,
            date: form.date,
            prediction: "Calculating...",
            id: form.id,
            imageURL : form.imageURL,
            imageURLresult : form.imageURLresult,
            fact: form.fact,
            stat: form.stat
        }
        fetch('https://lungnoduledetection.firebaseio.com/users/' + userKey + '/table.json',{
            method: "POST",
            body: JSON.stringify(newData),
            headers: { 'Content-Type': "application/x-www-form-urlencoded" }
        })
        .then(response => {         
            res.json({success : true})
        }) 
        .catch((error) => {
            res.json({success : false})
            console.log(error);
        }); 
    }, function (error) {
        res.json("Error: " + error.code)
        // console.log("Error: " + error.code);
    });
})

app.put('/editdata',(req,res) => {
    var form = req.body
    var emailUser = req.decoded
    var Ref = firebase.database().ref("users/");
    Ref.orderByChild("email").equalTo(emailUser.email).once("value", function(data) {
        var userKey
        for (let key in data.val()) {
            userKey = key
            break
        }
        // console.log('https://lungnoduledetection.firebaseio.com/users/' + userKey + '/table/' + form.id + '.json')
        // var Ref = firebase.database().ref("users/" + userKey + '/table/' + form.id);
        // Ref.once("value", function(data) {
        //     dataFit = data.val()
        //     var factEdit
        //     if(dataFit.fact != form.fact){
        //         factEdit = form.fact
        //     } else {
        //         factEdit = dataFit.fact
        //     }
            var editData = {
                name: form.name,
                fact: form.fact,
                stat: '1',
                gender: form.gender,
                age: form.age,
                date: form.date,
                prediction: form.prediction,
                imageURL : form.imageURL,
                imageURLresult : form.imageURLresult,
            } 
            console.log(editData)
            fetch('https://lungnoduledetection.firebaseio.com/users/' + userKey + '/table/' + form.id_data + '.json',{
                method: "PUT",
                body: JSON.stringify(editData),
                headers: { 'Content-Type': "application/x-www-form-urlencoded" }
            })
            .then(response => {         
                res.json({success : true})
            }) 
            .catch((error) => {
                res.json({success : false})
                console.log(error);
            }); 
        // })
    }, function (error) {
        res.json("Error: " + error.code)
        // console.log("Error: " + error.code);
    });
})

app.listen(port, () => {
    console.log('Magic happens at http://localhost:' + port);
});
