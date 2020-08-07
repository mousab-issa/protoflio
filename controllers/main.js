const Project = require('../models/projects');
const User = require('../models/user');
const crypto = require('crypto');
const fs=require('fs')
const path=require('path')
const PDFDocument = require('pdfkit');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const sendgridtransporter = require('nodemailer-sendgrid-transport');
const { validationResult } = require('express-validator');
const { deleteFile } = require('../util/delete');

const pdf = new PDFDocument();

const Transporter = nodemailer.createTransport(sendgridtransporter({
    auth: {
        api_key: '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'
    }
}))

const ITEM_PER_PAGE=3



exports.getindex = (req, res, next) => {
    const page=+req.query.page||1; 
    let message = req.flash('Error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    let totalItems;
    Project.countDocuments().then(total=>{
        totalItems=total;
        return Project.find().limit(ITEM_PER_PAGE).skip((page-1)*ITEM_PER_PAGE).then(projects => {
            return res.render('index.ejs', {
                previousPage:page-1,
                currentPage:page,
                nextPage:page+1,
                hasprevious:page>1,
                hasnext:page*ITEM_PER_PAGE<totalItems,
                lastPage:Math.ceil(totalItems/ITEM_PER_PAGE),
                projects: projects,
                messages: message,
                errors:false,
                validationError:[],
                type:'index'
            })
        })
    }).catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });

}

exports.addProject = (req, res, next) => {
    const title = req.body.title;
    const description = req.body.description;
    const userId = req.user
    const imageUrl=req.file;
    console.log(imageUrl)
    const project = new Project({
        title: title,
        description: description,
        userId: userId,
        imgUrl:imageUrl.path
    })
    project.save();
    return res.redirect('/')

}



exports.DeleteProject = (req, res, next) => {
    const projectId=req.params.projectId;
    Project.findById(projectId).then(user=>{
        deleteFile(user.imgUrl);
        return Project.findByIdAndDelete(projectId)
    }
    ).then(result=>{
        res.status(200).json({message:'success'})
    }).catch(err=>{console.log(err)
        res.status(500).json({message:'deleting failed'})
    })
   

}

exports.getResume=(req,res,next)=>{
    const Filepath= path.resolve('data','RESUME.pdf')

    const readStream = fs.createReadStream(Filepath);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment;filename="RESUME_MOUSAB ALHAMADA.pdf"');
    readStream.pipe(res);

}

exports.signup = (req, res, next) => {
    let message = req.flash('Error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    console.log(req.body)
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors)
       return Project.find().then(projects => {
             res.status(400).render('index.ejs', {
                projects: projects,
                messages:message,
                validationError: errors.array(),
                errors:true,
                type:'signup'
            })
        })
      }
    User.findOne({
        email: email
    }).then(userdoc => {
        if (userdoc) {
            req.flash('Error', 'User by this Email already exists!')
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
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })

}
exports.login = (req, res, next) => {

    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    
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
    }).catch(err => 
        { const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
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
        }).catch(err => 
            { const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
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
    }).catch(err => 
        { const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    })
    console.log(token)
    res.redirect('/')
}
