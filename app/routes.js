const geoUrl = "https://maps.googleapis.com/maps/api/geocode/json?&key=AIzaSyBAQlSMbOLlUdpU1idGcHdi0uqvUaLEUl8&address=AIzaSyBAQlSMbOLlUdpU1idGcHdi0uqvUaLEUl8"
let mongoose = require('mongoose');
const fs= require("fs");
const path = require("path");

// const ObjectId = require("mongodb").ObjectI;
const GoogleStrategy = require('passport-google-oauth20').Strategy

module.exports = function(app, passport, db, ObjectId, multer) {


// normal routes ===============================================================
var storage = multer.diskStorage({
destination: (req, file, cb) => {
  cb(null, 'public/images/uploads')
},
filename: (req, file, cb) => {
  cb(null, file.fieldname + '-' + Date.now() + ".png")
}
});
var upload = multer({storage: storage});




    app.post("/upload", upload.single("file-to-upload"), (req, res) => {
      let time = new Date().toLocaleString();
      let user = req.user;
      let imgData = fs.readFileSync(path.join(__dirname + '/../public/images/uploads/' + req.file.filename))

      db.collection("posts").save(
        {
          title: req.body.title,
          body: req.body.body,
          status: req.body.status,
          createdAt: time,
          //user: req.user._id,
          img: imgData,
          // comment: [],
          postedBy:req.user._id
        },
        (err, result) => {
          if (err) return console.log(err);
          console.log("saved to database");
          res.redirect("/therapist-profile");
        }
      );
    });

    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    app.get('/therapist-profile', isLoggedIn, (req, res) => {
      let user = req.user;
      db.collection('posts')
        .find({postedBy : user._id})

        .toArray((err, result) => {
        if (err) return console.log(err)

        res.render('therapist-profile.ejs', {
          user : req.user,
          posts: result,
        })
      })
  });

  // FEED =====================
    app.get('/feed-therapist', isLoggedIn, function(req, res) {
      db.collection('posts').find().toArray((err, result) => {
        if (err) return console.log(err)
        res.render('feed-therapist.ejs', {
          user : req.user,
          messages: result
        })
      })
  });

  // @desc    Delete story
  // @route   DELETE /stories/:id
  app.delete('/:id', isLoggedIn, async (req, res) => {
    try {
      let story = await Story.findById(req.params.id).lean()

      if (!story) {
        return res.render('error/404')
      }

      if (story.user != req.user.id) {
        res.redirect('/therapist-profile.ejs')
      } else {
        await Story.remove({ _id: req.params.id })
        res.redirect('/therapist-profile.ejs')
      }
    } catch (err) {
      console.error(err)
      return res.render('error/500')
    }
  })



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

    //
    // app.get('/feed-therapist', isLoggedIn, function(req, res) {
    //   console.log("mary")
    //     db.collection('posts').find({})
    //
    //
    //       .toArray((err, result) => {
    //       if (err) return console.log(err)
    //
    //       res.render('feed-therapist.ejs', {
    //         user:req.user,
    //         posts: result
    //       })
    //     })
    // });

    // app.post("/makePost", upload.single("file-to-upload"), (req, res) => {
    //   let time = new Date().toLocaleString();
    //
    //   let user = req.user;
    //   db.collection("posts").save(
    //     {
    //       caption: req.body.caption,
    //       img: "images/uploads/" + req.file.filename,
    //       postedBy: user.local.username,
    //       time,
    //       like: 0,
    //       likedBy: [],
    //       comment: [],
    //
    //     },
    //     (err, result) => {
    //       if (err) return console.log(err);
    //       console.log("saved to database");
    //       res.redirect("/therapist-profile");
    //     }
    //   );
    // });
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


app.post("/maketherapistAdressaddress", (req, res) => {
  let time = new Date().toLocaleString();

  let user = req.user;
  console.log(user);


  db.collection('users')
  .findOneAndUpdate({_id: req.user._id}, {
    $set: {
      userType: "expert"
    }
  }, (err, result) => {
    if (err) return res.send(err)
  })
   console.log(req.body);

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
      res.redirect("/therapist-profile");
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
