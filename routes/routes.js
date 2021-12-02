const geoUrl = "https://maps.googleapis.com/maps/api/geocode/json?&key=AIzaSyBAQlSMbOLlUdpU1idGcHdi0uqvUaLEUl8&address=AIzaSyBAQlSMbOLlUdpU1idGcHdi0uqvUaLEUl8"
let mongoose = require('mongoose');
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
var async = require("async");
// const Comments = require('../../models/comments')

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
  var upload = multer({
    storage: storage
  });

  app.get('/post/:postComments', isLoggedIn, function(req, res) {
    console.log('params', req.params);
    let postId = ObjectId(req.params.postComments);
    console.log('objectId', postId);
    db.collection('posts')
      .find({
        _id: postId,
      })
      .toArray((err, result) => {
        if (err) return console.log(err);
        db.collection('comments')
          .find({
            postId: postId,
          })
          .toArray((err, result02) => {
            res.render('post.ejs', {
              user: req.user,
              posts: result,
              comments: result02,
            });
          });
      });
  });

  app.post('/comment/:postComments', (req, res) => {

    let postId = ObjectId(req.params.postComments);

    db.collection('comments').save({
        comment: req.body.comment,
        postId: postId,
        postedBy: req.user.firstName
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log('saved to database');
        res.redirect(`/post/${postId}`);
      }
    );
  });



  app.post("/upload", isLoggedIn, upload.single("file-to-upload"), (req, res) => {
    // let time = new Date()
    var now = new Date()
    var date = now.toLocaleDateString();
    var time = now.toLocaleTimeString();
    const currentUser = req.user.firstName + " " + req.user.surname;
    let imgData = fs.readFileSync(path.join(__dirname + '/../public/images/uploads/' + req.file.filename))

    db.collection("posts").save({
        title: req.body.title,
        body: req.body.body,
        status: req.body.status,
        createdAt: time,
        createdOn: date,
        img: imgData,
        postedBy: currentUser,
        userId: req.user._id,
        userType: req.user.userType,
        date: Date.now(),
      },
      (err, result) => {
        if (err) return console.log(err);
        console.log("saved to database");

        if (req.user.userType === "client") {
          res.redirect("/client-profile")
        } else {

          res.redirect("/therapist-profile");
        }
      });
  });

  // Creates a comment and sends the data to the database.
  app.post("/createcomment", (req, res, next) => {
    const currentUser = req.user.firstName + " " + req.user.surname;

    if (!errors.isEmpty()) {
      res.json({
        errors: errors.array()
      })
    } else {
      db.collection("comments").save({
        content: req.body.content,
        author: currentUser,
        date: Date.now(),
        parentpostid: req.body.parentpostid,
        userid: req.user.id
      }).save(err => {
        if (err) {
          return next(err);
        };
        res.redirect("/client-profile");
      });
    }
  });


  // Sends userid to like array in database, and only allows one entry per userid.
  app.post("/postLike", async (req, res, next) => {
    const postid = mongoose.Types.ObjectId(req.body.id)
    const userid = mongoose.Types.ObjectId(req.user._id)

    await Posts.findById(postid, (err, post) => {
      if (post.likes.includes(userid)) {
        post.likes.pull(userid)
        post.save(err => {
          if (err) {
            return next(err)
          }
        })
      } else {
        post.likes.push(userid)
        post.save(err => {
          if (err) {
            return next(err)
          }
        })
      }
    })
  })



  // show the home page (will also have our login links)
  app.get('/', function(req, res) {
    res.render('index.ejs');
  });

  // app.get('/:id', isLoggedIn, (req, res) => {
  //   let user = req.user;
  //   post = db.collection('posts').findOne({
  //     _id: req.user._id
  //   }).populate('user').lean()
  //   if (err) return console.log(err)
  //
  //   res.render('post.ejs', {
  //     post,
  //   })
  // });
  // router.get('/:id', ensureAuth, async (req, res) => {
  //   try {
  //     let post = await Story.findById(req.params.id).populate('user').lean()
  //
  //     if (!story) {
  //       return res.render('error/404')
  //     }
  //
  //     if (story.user._id != req.user.id && story.status == 'private') {
  //       res.render('error/404')
  //     } else {
  //       res.render('stories/show', {
  //         story,
  //       })
  //     }
  //   } catch (err) {
  //     console.error(err)
  //     res.render('error/404')
  //   }
  // })

  app.get('/therapist-profile', isLoggedIn, (req, res) => {
    let user = req.user;

    db.collection('posts')
      .find({
        userId: user._id
      })

      .toArray((err, result) => {
        if (err) return console.log(err)

        res.render('therapist-profile.ejs', {


          user: req.user,
          posts: result,
        })
      })
  });



  function distance(lat1, lon1, lat2, lon2) {
    var R = 6371; // km
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
  }
  // Converts numeric degrees to radians
  function toRad(Value) {
    return Value * Math.PI / 180;
  }

  app.get('/findTherapists', function(req, res) {
    res.render('findTherapists.ejs', {
      therapists: []
    });
  });

  app.post('/findTherapists', isLoggedIn, (req, res) => {
    let user = req.user;
    db.collection('addressTherapists')
      .find()

      .toArray((err, result) => {
        if (err) return console.log(err)
        console.log("all therapists", result);
        const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?&key=AIzaSyBAQlSMbOLlUdpU1idGcHdi0uqvUaLEUl8&address=${req.body.zip}`

        locObj = fetch(geoUrl)
          .then((res) => res.json()).then((data) => {

            const radius = parseInt(req.body.radius)
            const userLat = data.results[0].geometry.location.lat;
            const userLon = data.results[0].geometry.location.lng;
            console.log("location", radius, userLat, userLon, result)

            const therapistsInRange = result.filter(t => {
              const dist = distance(userLat, userLon, t.location.lat, t.location.lng)
              t.distance = dist


              return dist < radius
            })

            therapistsInRange.sort((a, b) => a.distance - b.distance)

            res.render('findTherapists.ejs', {
              user: req.user,
              therapists: therapistsInRange,
            })
          })
      })
  });

  // // FEED =====================
  // app.get('/feed', isLoggedIn, function(req, res) {
  //   db.collection('posts').find().toArray((err, result) => {
  //     if (err) return console.log(err)
  //     res.render('feed.ejs', {
  //       user: req.user,
  //       posts: result
  //     })
  //   })
  // });

  app.get('/feed', async (req, res) => {
    const allComments = await db.collection("comments").countDocuments()
    const allUsers = await db.collection("Users").countDocuments() - 1
    console.log('mary');

    const numArray = [];


    var bidArr = {};
    var tasks = [
      // Load users
      function(callback) {
        db.collection('users').find({}).toArray(function(err, users) {
          if (err) return callback(err);
          bidArr.users = users;
          callback();
        });
      },
      // Load posts
      function(callback) {
        db.collection('posts').find({}).toArray(function(err, posts) {
          if (err) return callback(err);
          bidArr.posts = posts;
          callback();
        });
      },
      // Load comments
      function(callback) {
        db.collection('comments').find({}).toArray(function(err, comments) {
          if (err) return callback(err);
          bidArr.comments = comments;
          callback();
        });
      }
    ];


    async.parallel(tasks, function(err) {
      res.render('feed', {
        bidArr,
        allComments,
        numArray
      });
    });
  });

  // app.get('/feed', isLoggedIn, function(req, res) {
  //   console.log("mary")
  //     db.collection('posts').find({})
  //
  //
  //       .toArray((err, result) => {
  //       if (err) return console.log(err)
  //
  //       res.render('feed.ejs', {
  //         user:req.user,
  //         posts: result
  //       })
  //     })
  // });

  // @desc    Delete story
  // @route   DELETE /stories/:id
  // app.delete('/:id', isLoggedIn, async (req, res) => {
  //   try {
  //     let story = await Story.findById(req.params.id).lean()
  //
  //     if (!story) {
  //       return res.render('error/404')
  //     }
  //
  //     if (story.user != req.user.id) {
  //       res.redirect('/therapist-profile.ejs')
  //     } else {
  //       await Story.remove({
  //         _id: req.params.id
  //       })
  //       res.redirect('/therapist-profile.ejs')
  //     }
  //   } catch (err) {
  //     console.error(err)
  //     return res.render('error/500')
  //   }
  // })



  // PROFILE SECTION =========================
  app.get('/profile-therapist', isLoggedIn, function(req, res) {
    let user = req.user;
    db.collection('addressTherapists')
      .find({
        postedBy: user.local.email
      })

      .toArray((err, result) => {
        if (err) return console.log(err)

        res.render('profile-therapist.ejs', {
          user: req.user,
          addressTherapists: result,
        })
      })
  });





  // app.get('/feed', isLoggedIn, function(req, res) {
  //   console.log("mary")
  //   db.collection('posts').find({})
  //
  //
  //     .toArray((err, result) => {
  //       if (err) return console.log(err)
  //
  //       res.render('feed.ejs', {
  //         user: req.user,
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
  // app.post('/add', isLoggedIn, async (req, res) => {
  //   try {
  //     req.body.user = req.user.id
  //     req.body.userType = req.user.userType
  //     await db.collection('posts').save(req.body)
  //     console.log('saved to database')
  //     res.redirect('/therapist-profile')
  //   } catch (err) {
  //     console.error(err)
  //     res.send(err)
  //   }
  // })
  app.get('/client-profile', isLoggedIn, function(req, res) {
    let user = req.user;
    console.log(req.user);
    db.collection('posts')
      .find({
        userId: user._id
      })


      .toArray((err, result) => {
        if (err) return console.log(err)
        res.render('client-profile.ejs', {
          user: req.user,
          posts: result
        });
      });
  });





  // app.get('/profile', isLoggedIn, function(req, res) {
  //   let user = req.user;
  //   db.collection('posts')
  //     .find({
  //       postedBy: user._id
  //     })
  //
  //     .toArray((err, result) => {
  //       if (err) return console.log(err)
  //
  //       res.render('profile.ejs', {
  //         user: req.user,
  //         posts: result,
  //       })
  //     })
  // });


  // LOGOUT ==============================
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });

  // message board routes ===============================================================

  app.post('/messages', (req, res) => {
    db.collection('messages').save({
      name: req.body.name,
      msg: req.body.msg,
      thumbUp: 0,
      thumbDown: 0
    }, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/profile')
    })
  })

  app.put('/messages', (req, res) => {
    db.collection('messages')
      .findOneAndUpdate({
        name: req.body.name,
        msg: req.body.msg
      }, {
        $set: {
          thumbUp: req.body.thumbUp + 1
        }
      }, {
        sort: {
          _id: -1
        },
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

    const currentUser = req.user.firstName + " " + req.user.surname;


    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?&key=AIzaSyBAQlSMbOLlUdpU1idGcHdi0uqvUaLEUl8&address=${req.body.zip}`

    locObj = fetch(geoUrl)
      .then((res) => res.json()).then((data) =>

        {
          console.log(data);

          const location = data.results[0].geometry.location;
          console.log(location)

          let formattedAddress = (data.results[0].formatted_address);

          console.log("This is the full", formattedAddress);

          db.collection('users')
            .findOneAndUpdate({
              _id: req.user._id
            }, {
              $set: {

                userType: "expert",
                latitude: location.lat,
                longitude: location.lng,
              }
            }, (err, result) => {
              if (err) return res.send(err)
            })
          console.log("body", req.body);

          db.collection("addressTherapists").save({
              name: currentUser,
              postedBy: user._id,
              address: req.body.address,
              address2: req.body.address2,
              state: req.body.state,
              zip: req.body.zip,
              city: req.body.city,
              time,
              location: location,
              formattedAddress: formattedAddress
              // comment: [],
            },
            (err, result) => {
              if (err) return console.log(err);
              console.log("saved to database");
              res.redirect("/therapist-profile");
            }
          );


        }).then((res) => res);


  });

  app.put('/messagesminus', (req, res) => {
    db.collection('messages')
      .findOneAndUpdate({
        name: req.body.name,
        msg: req.body.msg
      }, {
        $set: {
          thumbUp: req.body.thumbUp - 1
        }
      }, {
        sort: {
          _id: -1
        },
        upsert: true
      }, (err, result) => {
        if (err) return res.send(err)
        res.send(result)
      })
  })


  app.delete('/messages', (req, res) => {
    db.collection('messages').findOneAndDelete({
      name: req.body.name,
      msg: req.body.msg
    }, (err, result) => {
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
    res.render('loginclient.ejs', {
      message: req.flash('loginMessage')
    });
  });

  app.get('/login-therapist', function(req, res) {
    res.render('login-therapist.ejs', {
      message: req.flash('loginMessage')
    });
  });

  app.post('/login-therapist', passport.authenticate('local-login', {
    successRedirect: '/therapist-profile', // redirect to the secure profile section
    failureRedirect: '/login-therapist', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // process the login form
  app.post('/loginclient', passport.authenticate('local-login', {
    successRedirect: '/client-profile', // redirect to the secure profile section
    failureRedirect: '/loginclient', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));
  // process the therapist login form


  // SIGNUP =================================
  // show the signup form
  app.get('/signupclient', function(req, res) {
    console.log(db)
    res.render('signupclient.ejs', {
      message: req.flash('signupMessage')
    });
  });
  app.get('/signup-therapist', function(req, res) {
    console.log(db)
    res.render('signup-therapist.ejs', {
      message: req.flash('signupMessage')
    });
  });

  // process the signup form
  app.post('/signupclient', passport.authenticate('local-signup', {

    //
    // successRedirect : '/profile', // redirect to the secure profile section
    failureRedirect: '/signupclient', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }), function(req, res) {
    db.collection('users')
      .findOneAndUpdate({
        _id: req.user._id
      }, {
        $set: {
          userType: "client",
          zipcode: req.body.zipcode,
          firstName: req.body.firstName,
          surname: req.body.surname,
        }
      }, (err, result) => {
        if (err) return res.send(err)
        res.redirect("/client-profile")
      })
  });
  app.post('/signup-therapist', passport.authenticate('local-signup', {
    // successRedirect: '/profile-therapist', // redirect to the secure profile section
    failureRedirect: '/signup-therapist', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }), function(req, res) {
    db.collection('users')
      .findOneAndUpdate({
        _id: req.user._id
      }, {
        $set: {
          userType: "expert",
          firstName: req.body.firstName,
          surname: req.body.surname,
          phoneNumber: req.body.phoneNumber
        }
      }, (err, result) => {
        if (err) return res.send(err)
        res.redirect("/profile-therapist")
      })
  });



  // @route   GET /auth/google
  app.get('/google-login',
    passport.authenticate('google-login', {
      scope: ['profile']
    }))

  // @desc    Google auth callback
  // @route   GET /auth/google/callback
  app.get(
    '/auth/google/callback',
    passport.authenticate('google-login', {
      failureRedirect: '/'
    }),
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
    var user = req.user;
    user.local.email = undefined;
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