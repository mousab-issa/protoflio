const express = require('express')// backend framwork 
const bodyParser = require('body-parser')//parsing the res body to the req
const path = require('path') //to detrmain a path in the root folder 
const URI = 'mongodb+srv://Admin:0502118894@cluster0.p7ad7.mongodb.net/protofolio' //url for the connection of my mongodb
const mongoose = require('mongoose')//to defind a schemea in mongodb
const csrf = require('csurf') //to defend agains csrf attacks 
const flash = require('connect-flash');//to flash an error message 
const multer = require('multer')//to parsing multipart data like images 
//session and store  
const session = require('express-session') //to genrate a session in express 
const MongoDBStore = require('connect-mongodb-session')(session) //to store the session in mongodb 
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

//filtering the data for the multipart 
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'images/png' || file.mimetype ==='images/jpg' || file.mimetype ==='images/jpeg') {
        cb(null, false)
    } else {
        cb(null, true)
    }
}
//definging the file storage of the multipart data 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now()+'-' +file.originalname)
    }
})
//uplaoding the data to multer 
const upload = multer({
    storage: storage,
    fileFilter:fileFilter
}).single('image')


//parsing the request body 
app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(
    upload
);
//

//definging a session store 
const store = new MongoDBStore({
    uri: URI,
    collection: 'mySessions'
});

//using a session middleware 
app.use(session({
    secret: 'my first protofolio',
    resave: false,
    saveUninitialized: false,
    store: store
}))
//make sure to use flash a nd csurf middlewares after defining the session 
app.use(flash());
app.use(csrfProtection);

//public folder 
app.use(express.static(path.join(__dirname, 'public')))
//deifing a public path after a route 
app.use('/images', express.static(path.join(__dirname, 'images')))
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
        .catch(err => next(new Error(err)));

});
//

app.use((req, res, next) => {
    res.locals.isAuthinticated = req.session.isAuthinticated;
    res.locals.csrfToken = req.csrfToken()
    next();
})



//routing
app.use(mainRoute)

app.get('/500', (req, res, next) => {
    res.status(500).render('500.ejs')
})

app.use((req, res, next) => {
    res.status(404).render('404.ejs')
})
//

//error handler middleware starts with error 
// app.use((error, req, res, next) => {
//     res.status(500).render('500.ejs');
// })

//listning to port 3000 after connecting to monogodb
mongoose.connect('mongodb+srv://Admin:0502118894@cluster0.p7ad7.mongodb.net/protofolio?retryWrites=true&w=majority')
    .then(res => {
        app.listen(3000)
    }).catch(err => console.log(err))
