const express = require('express')
const bodyParser = require('body-parser')
const path = require('path')
const URI = 'mongodb+srv://Admin:0502118894@cluster0.p7ad7.mongodb.net/protofolio'
const mongoose = require('mongoose')
const csrf = require('csurf')
const flash = require('connect-flash');
//session and store  
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
//

const app = express();

//routers
const mainRoute = require('./routes/main');
const User = require('./models/user');
var csrfProtection = csrf();

//
//setting the tamplet engine
app.set('view engine', 'ejs')
app.set('views', 'views')
//


//parsing the request body 
app.use(bodyParser.urlencoded({
    extended: false
}))
//

const store = new MongoDBStore({
    uri: URI,
    collection: 'mySessions'
});

app.use(session({
    secret: 'my first protofolio',
    resave: false,
    saveUninitialized: false,
    store: store
}))
app.use(flash());
app.use(csrfProtection);

//public folder 
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'node_modules')))
//

//user
app.use((req, res, next) => {
    if (!req.session.user) {
      return next();
    }
    User.findById(req.session.user._id)
      .then(user => {
        req.user = user;
        next();
      })
      .catch(err => console.log(err));
      
  });
//

app.use((req, res, next)=>{
    res.locals.isAuthinticated = req.session.isAuthinticated;
    res.locals.csrfToken= req.csrfToken()
    next();
})


  
//routing
app.use(mainRoute)

app.use((req, res, next) => {
    res.render('404.ejs')
})
//

//listning to port 3000 after connecting to monogodb
mongoose.connect('mongodb+srv://Admin:0502118894@cluster0.p7ad7.mongodb.net/protofolio?retryWrites=true&w=majority')
    .then(res => {
        app.listen(3000)
    }).catch(err => console.log(err))
