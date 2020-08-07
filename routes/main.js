const express = require('express');
const {
    getindex,
    addProject,
    login,
    getresetpassword,
    postresetpassword,
    logout,
    signup,
    getNewPassword,
    postNewPassword,
    DeleteProject,
    getResume
} = require('../controllers/main');
const {
    body,
} = require('express-validator');

const router = express.Router();

router.get('/', getindex);

router.get('/rest-password', getresetpassword);

router.get('/rest-password/:token', getNewPassword);

router.post('/rest-password', postresetpassword);

router.post('/new-password', postNewPassword);

router.post('/add-project', addProject);

// router.post('/delete-project', DeleteProject);

router.delete('/projects/:projectId', DeleteProject);

router.post('/signup', [
    body('email').isEmail()
    .withMessage('Please Enter A valid Email value').normalizeEmail(),
    body('password').isLength({
        min: 8
    }).withMessage('The password has to be at least 8 charcter'),
    body('Confirmedpassword').custom((value, {
        req
    }) => {
        if (value !== req.body.password) {
            throw new Error('Please Enter a matching password')
        }
        return true
    })
], signup);

router.post('/login',[body('email').isEmail().withMessage('Please Enter a valid emaild address')], login);
router.post('/logout', logout);
router.get('/resume',getResume)

module.exports = router
