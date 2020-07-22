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
    DeleteProject
} = require('../controllers/main');
const router = express.Router();

router.get('/', getindex);

router.get('/rest-password', getresetpassword);

router.get('/rest-password/:token', getNewPassword);

router.post('/rest-password', postresetpassword);

router.post('/new-password', postNewPassword);

router.post('/add-project', addProject);

router.post('/delete-project', DeleteProject);

router.post('/signup', signup);

router.post('/login', login);

router.post('/logout', logout);

module.exports = router
