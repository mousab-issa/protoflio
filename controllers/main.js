const Project = require('../models/projects');
const User = require('../models/user');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const sendgridtransporter = require('nodemailer-sendgrid-transport');
const { ObjectID } = require('mongodb');

const Transporter = nodemailer.createTransport(sendgridtransporter({
    auth: {
        api_key: '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'
    }
}))

exports.getindex = (req, res, next) => {
    let message = req.flash('Error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    Project.find().then(projects => {
        return res.render('index.ejs', {
            projects: projects,
            messages: message
        })
    })

}

exports.addProject = (req, res, next) => {
    const title = req.body.title;
    const description = req.body.description;
    const userId = req.user
    const project = new Project({
        title: title,
        description: description,
        userId: userId
    })
    project.save();
    return res.redirect('/')

}
exports.DeleteProject = (req, res, next) => {
    const projectId=req.body.projectId;
    console.log(projectId)
    Project.findByIdAndDelete(projectId).then(result=>{
        console.log(result)
        res.redirect('/')
    }
    ).catch(err=>console.log(err))
   

}


exports.signup = (req, res, next) => {
    console.log(req.body)
    const email = req.body.email;
    const password = req.body.password;
    User.findOne({
        email: email
    }).then(userdoc => {
        if (userdoc) {
            req.flash('Error', 'User does  exists!')
            return res.redirect('/');
        }
        bcrypt.hash(password, 12).then(hased => {
            const user = new User({
                email: email,
                password: hased
            });
            return user.save();
        }).then(result => {
            res.redirect('/');
            console.log(email)
            return Transporter.sendMail({
                to: email,
                from: 'mosab5laf@gmail.com',
                subject: 'Sign up succssfull',
                html: '<h1> Your signup was succfull</h1>'
            })
        }).catch(err => {
            console.log(err)
        })
    }).catch(err => {
        console.log(err)
    })

}
exports.login = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;
    User.findOne({
        email: email
    }).then(user => {
        if (!user) {
            req.flash('Error', 'User does not exists!')
            return res.redirect('/');
        }
        bcrypt
            .compare(password, user.password)
            .then(doMatch => {
                if (doMatch) {
                    req.session.isAuthinticated = true;
                    req.session.user = user;
                    return req.session.save(err => {
                        console.log(err);
                        res.redirect('/');
                    });
                }
                req.flash('Error', 'the password does not match!')
                res.redirect('/');
            }).catch(err => {
                console.log(err);
                res.redirect('/');
            });
    }).catch(err => console.log(err))
}


exports.logout = (req, res, next) => {
    req.session.destroy(function (err) {
        res.redirect('/')
        console.log(err)
    })

}

exports.getresetpassword = (req, res, next) => {
    let message = req.flash('Error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('subviews/reset-password.ejs', {
        messages: message
    })
}

exports.postresetpassword = (req, res, next) => {
    console.log(req.body.email);
    const email = req.body.email;

    crypto.randomBytes(32, (err, buf) => {
        if (err) {
            console.log(err)
            return res.redirect('/rest-password');
        }
        const token = buf.toString('hex')
        User.findOne({
            email: email
        }).then(user => {
            if (!user) {
                req.flash('Error', 'Email does not exists!')
                return res.redirect('/rest-password')
            }
            Transporter.sendMail({
                to: email,
                from: 'mosab5laf@gmail.com',
                subject: 'resetting password',
                html: `<p>click this <a href="http://localhost:3000/rest-password/${token}"> Link </a> to reset password</p>`
            }).then(result => {
                console.log(result)
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                return user.save();
            })
        }).then(result => {
            res.redirect('/')
        }).catch(err => {
            console.log(err)
            return res.redirect('/')
        })
    });
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    const password = req.body.password;

    let message = req.flash('Error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('subviews/new-password.ejs', {
        messages: message,
        token: token,
    })
}

exports.postNewPassword = (req, res, next) => {
    const token = req.body.token;
    const password = req.body.password;
    User.findOne({
        resetToken: token,
        resetTokenExpiration: {
            $gt: Date.now()
        }
    }).then(user => {
        bcrypt.hash(password, 12).then(hased => {
            user.password=hased;
            user.resetToken=undefined;
            user.resetTokenExpiration=undefined;
            return user.save()
        })
    }).catch(err=>console.log(err))
    console.log(token)
    res.redirect('/')
}