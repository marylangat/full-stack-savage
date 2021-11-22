var mongoose = require('mongoose');
const ObjectId = require("mongodb").ObjectId;
const GoogleStrategy = require('passport-google-oauth20').Strategy


module.exports = function (app, passport, db, multer, ObjectId){
  // {
const geoUrl = "https://maps.googleapis.com/maps/api/geocode/json?&key=AIzaSyBAQlSMbOLlUdpU1idGcHdi0uqvUaLEUl8&address=AIzaSyBAQlSMbOLlUdpU1idGcHdi0uqvUaLEUl8"
// normal routes ===============================================================

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    app.get('/therapist-profile', isLoggedIn, (req, res) => {
      let user = req.user;
      db.collection('posts')
        .find({postedBy : user.local.email})

        .toArray((err, result) => {
        if (err) return console.log(err)

        res.render('therapist-profile', {
          user : req.user,
          posts: result,
        })
      })
  });



    // PROFILE SECTION =========================
    app.get('/profile-therapist', isLoggedIn, function(req, res) {
        let user = req.user;
        db.collection('addressTherapists')
          .find({postedBy : user.local.email})

          .toArray((err, result) => {
          if (err) return console.log(err)

          res.render('profile-therapist.ejs', {
            user : req.user,
            addressTherapists: result,
          })
        })
    });


    app.get('/feed-therapist', isLoggedIn, function(req, res) {
        let user = req.user;
        db.collection('addressTherapists')
          .find({postedBy : user.local.email})

          .toArray((err, result) => {
          if (err) return console.log(err)

          res.render('feed-therapist', {
            user : req.user,
            addressTherapists: result,
          })
        })
    });

    app.post("/makePost", upload.single("file-to-upload"), (req, res) => {
      let time = new Date().toLocaleString();

      let user = req.user;
      db.collection("posts").save(
        {
          caption: req.body.caption,
          img: "images/uploads/" + req.file.filename,
          postedBy: user.local.username,
          time,
          like: 0,
          likedBy: [],
          comment: [],

        },
        (err, result) => {
          if (err) return console.log(err);
          console.log("saved to database");
          res.redirect("/therapist-profile");
        }
      );
    });
    app.post('/add', isLoggedIn, async (req, res) => {
      try {
        req.body.user = req.user.id
      await db.collection('posts').save(req.body)
          console.log('saved to database')
          res.redirect('/therapist-profile')
      } catch (err) {
        console.error(err)
        res.send(err)
      }
    })

    app.get('/profile', isLoggedIn, function(req, res) {
        let user = req.user;
        db.collection('addressTherapists')
          .find({postedBy : user.local.email})

          .toArray((err, result) => {
          if (err) return console.log(err)

          res.render('profile.ejs', {
            user : req.user,
            addressTherapists: result,
          })
        })
    });


    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// message board routes ===============================================================

    app.post('/messages', (req, res) => {
      db.collection('messages').save({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
        if (err) return console.log(err)
        console.log('saved to database')
        res.redirect('/profile')
      })
    })

    app.put('/messages', (req, res) => {
      db.collection('messages')
      .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
        $set: {
          thumbUp:req.body.thumbUp + 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })

//     exports.getStores = async (req, res, next) => {
//   try {
//     const stores = await Store.find();
//
//     return res.status(200).json({
//       success: true,
//       count: stores.length,
//       data: stores
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Server error' });
//   }
// };
//
// // @desc  Create a store
// // @route POST /api/v1/stores
// // @access Public
// exports.addStore = async (req, res, next) => {
//   try {
//     const store = await Store.create(req.body);
//
//     return res.status(201).json({
//       success: true,
//       data: store
//     });
//   } catch (err) {
//     console.error(err);
//     if (err.code === 11000) {
//       return res.status(400).json({ error: 'This store already exists' });
//     }
//     res.status(500).json({ error: 'Server error' });
//   }
// };
//     app.post('/addAddress', (req, res) => {
//       let user = req.user;
//       db.collection('therapists')
//       .find(postedBy: user.local.username}) {
//         $set: {
//           thumbUp:req.body.thumbUp + 1
//         }
//       }, {
//         sort: {_id: -1},
//         upsert: true
//       }, (err, result) => {
//         if (err) return res.send(err)
//         res.send(result)
//       })
//     })


app.post("/maketherapistAdressaddress", (req, res) => {
  let time = new Date().toLocaleString();

  let user = req.user;
  console.log(user);
  let userType = "expert"

  db.collection('users')
  .findOneAndUpdate({_id: req.user._id}, {
    $set: {
      userType: "expert"
    }
  }, (err, result) => {
    if (err) return res.send(err)
  })

  db.collection("addressTherapists").save(
    {
      postedBy: user._id,
      address: req.body.address,
      address2: req.body.address2,
      state: req.body.state,
      zip: req.body.zip,

      city: req.body.city,
      time,
      // comment: [],
    },
    (err, result) => {
      if (err) return console.log(err);
      console.log("saved to database");
      res.redirect("/feed-therapist");
    }
  );
});

    app.put('/messagesminus', (req, res) => {
      db.collection('messages')
      .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
        $set: {
          thumbUp:req.body.thumbUp - 1
        }
      }, {
        sort: {_id: -1},
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
    })


    app.delete('/messages', (req, res) => {
      db.collection('messages').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
        if (err) return res.send(500, err)
        res.send('Message deleted!')
      })
    })

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/loginclient', function(req, res) {
            res.render('loginclient.ejs', { message: req.flash('loginMessage') });
        });

        app.get('/login-therapist', function(req, res) {
            res.render('login-therapist.ejs', { message: req.flash('loginMessage') });
        });

        app.post('/login-therapist', passport.authenticate('local-login', {
            successRedirect : '/therapist-profile', // redirect to the secure profile section
            failureRedirect : '/login-therapist', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));
        // process the therapist login form


        // SIGNUP =================================
        // show the signup form
        app.get('/signupclient', function(req, res) {
          console.log(db)
            res.render('signupclient.ejs', { message: req.flash('signupMessage') });
        });
        app.get('/signup-therapist', function(req, res) {
          console.log(db)
            res.render('signup-therapist.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signupclient', passport.authenticate('local-signup', {

          //
            // successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }), function(req, res){
          db.collection('users')
          .findOneAndUpdate({_id: req.user._id}, {
            $set: {
              userType: "client",
              zipcode: req.body.zipcode
            }
          }, (err, result) => {
            if (err) return res.send(err)
            res.redirect("/profile")
          })
        });
        app.post('/signup-therapist', passport.authenticate('local-signup', {
            successRedirect : '/profile-therapist', // redirect to the secure profile section
            failureRedirect : '/signup-therapist', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));



        // @route   GET /auth/google
app.get('/google-login',
passport.authenticate('google-login',
{ scope: ['profile'] }))

// @desc    Google auth callback
// @route   GET /auth/google/callback
app.get(
  '/auth/google/callback',
  passport.authenticate('google-login', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/login-therapist')
  }
)

// @desc    Logout user
// @route   /auth/logout
app.get('/logout', (req, res) => {
  req.logout()
  res.redirect('/')
})


// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });


};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
