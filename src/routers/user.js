const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer')
const sharp = require('sharp')
const auth = require('../middleware/auth.js');

// require app models
const User = require('../models/user.js')

const { sendWelcomeEmail, sendCancellationEmail } = require('../emails/account.js')
// create new router 
const router = new express.Router();

// create variable and assign multer to create a new instance of it
const upload = multer({

    // Remove the destination key so we allow multer to pass the image to the router function
    // instead of saving to the filesystem
    // dest: 'avatars',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/gm)) {
            return cb(new Error('Only image files are accepted (jpg/jpeg/png)!'));
        }
        cb(undefined, true)
    }
})

// Sign up
router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save();
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken();
        res.status(201).send({ user, token })
    } catch (err) {
        res.status(400).send(err.message)
    }

})

// Login route
router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({ user, token })
    } catch (err) {
        res.status(400).send(err)
    }
})

//logout router
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token;
        })
        await req.user.save()
        res.send(req.user)
    } catch (err) {
        res.status(500).send(err.message)
    }
})

//logout from all tokens
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send()
    } catch (err) {
        res.status(500).send(err.message)
    }
})

// Fetch user profile
router.get('/users/myaccount', auth, async (req, res) => {
    res.send(req.user)
})

// Fetch user by id
/*
router.get('/users/:id', async (req, res) => {
    const _id = req.params.id;
    const isValidId = mongoose.Types.ObjectId.isValid(_id)
    if (!isValidId) return res.status(400).send({ error: 'User ID is invalid' })
    try {
        console.log(_id);
        const user = await User.findById(_id);
        if (!user) {
            return res.status(404).send({ error: 'Unable to find User' })
        }
        res.send(user)
    } catch (err) {
        res.status(500).send(err)
    }
})
*/

// Update user by id
router.patch('/users/myaccount', auth, async (req, res) => {
    //Handle if unathorized parameter is being updated
    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    // const _id = req.params.id;
    // Handle if the ID provided is invalid
    // const isValidId = mongoose.Types.ObjectId.isValid(_id)
    // if (!isValidId) return res.status(400).send({ error: 'User ID is invalid' })

    try {
        // change findByIdAndUpdate  to save function to be able to use Middleware
        //const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })
        // const user = await User.findById(_id)
        // if (!user) {
        //     return res.status(404).send({ error: 'Unable to find user' })
        // }
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save();
        res.send(req.user)
    } catch (err) {

        res.status(500).send(err)
    }
})

//Delete user by ID
router.delete('/users/myaccount', auth, async (req, res) => {
    // const _id = req.user._id;
    // const isValidId = mongoose.Types.ObjectId.isValid(_id);
    // if (!isValidId) return res.status(400).send({ error: 'Invalid User ID' });
    try {
        // const user = await User.findByIdAndDelete(_id)
        // if (!user) return res.status(404).send({ error: 'No User Found!' })
        await req.user.remove();
        await sendCancellationEmail(req.user.email, req.user.name);
        res.send(req.user)
    } catch (err) {
        res.status(500).send(err)
    }
})

// Upload profile avatar
router.post('/users/myaccount/avatar', auth, upload.single('avatar'), async (req, res) => {
    try {
        const buffer = await sharp(req.file.buffer).resize(250, 250).png().toBuffer()
        req.user.avatar = buffer;
        await req.user.save()
        res.send(req.user)
    } catch (err) {
        res.status(500).send(err)
    }
}, (err, req, res, next) => {
    res.status(400).send({ error: err.message })
})

// Delete profile avatar
router.delete('/users/myaccount/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save()
        res.send(req.user)
    } catch (err) {
        res.status(500).send(err)
    }
})

//Get avatar image
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/jpg')
        res.send(user.avatar)

    } catch (err) {
        res.status(404).send(err)
    }
})
module.exports = router;