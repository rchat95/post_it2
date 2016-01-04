// server.js

// set up ======================================================================
// get all the tools we need
var express      = require('express');
var app          = express();
var port         = process.env.PORT || 8081;
var mongoose     = require('mongoose');
var passport     = require('passport');
var flash        = require('connect-flash');

var morgan       = require('morgan');
var path         = require('path');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade'); // set up jade for templating


// required for passport
app.use(session({ secret: 'No Secret' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
//require('./app/routes.js')(app, passport);
var router = express.Router();  
app.use(express.static('public'));
 // load our routes and pass in our app and fully configured passport
router.use(function(req, res, next) {
    // do logging
    console.log('Routes OK');
    next(); // make sure we go to the next routes and don't stop here
});

//Getting index to load up
app.get('/', function(req, res) {
    res.render('index');

});
app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login', { message: req.flash('loginMessage') }); 
    });
app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup', { message: req.flash('signupMessage') });
    });
app.get('/profile', isLoggedIn, function(req, res) {
        var photopath = 'http://graph.facebook.com/' + req.user.facebook.id + '/picture?type=large';
        res.render('profile', {
            user : req.user,
            ppath : photopath  // get the user out of session and pass to template
        });
    });
 app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
 //app.get('/connect/facebook', passport.authorize('facebook', { scope : ['email'] }));
    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/'
        }));
 // process the signup form
app.post('/signup', passport.authenticate('local-signup', {
    successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));
app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

app.use('/', router);
// launch ======================================================================
app.listen(port);
console.log('The magic happens on port ' + port);
