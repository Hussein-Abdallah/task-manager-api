const express = require('express');
const mongoose = require('mongoose');

const Task = require('../models/task.js');
const User = require('../models/user.js');
const auth = require('../middleware/auth.js')
const router = new express.Router();

// Create a new Task
router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body);
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (err) {
        res.status(400).send(err)
    }
})

// Fetch all tasks
// optional: GET /tasks?completed=true
// Pagination Optional /tasks?limit=10&skip=0
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
    // Filter by query string
    const match = {};
    if (req.query.completed) {
        match.completed = req.query.completed === 'true';
    }
    const sort = {};
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    }
    try {
        await req.user.populate({
            //destructure the popuplate to have the path for tasks and 
            // the match filter for the query string
            path: 'tasks',
            match,
            // limit and skip used for pagination
            // to sort the documents, add sort option with the field to sort
            // such as createdAt and set the value to 1 for Ascending or -1 for Descending
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();
        res.send(req.user.tasks)
    } catch (err) {
        res.status(500).send(err)
    }

})

// Fetch task by id
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    const isValidId = mongoose.Types.ObjectId.isValid(_id);
    if (!isValidId) return res.status(400).send({ error: 'Invalid task ID' })
    try {
        //const task = await Task.findById(_id);
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.status(404).send({ error: 'Unable to find task' })
        }
        res.send(task)
    } catch (err) {
        res.status(500).send(err)
    }
})

//Update a task
router.patch('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    const isValidId = mongoose.Types.ObjectId.isValid(_id)
    if (!isValidId) return res.status(400).send({ error: 'Invalid Task ID' })

    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));
    if (!isValidOperation) return res.status(400).send({ error: 'Invalid update parameters' })

    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) return res.status(404).send({ error: 'Task not found!' })
        updates.forEach((update) => task[update] = req.body[update]);
        await task.save()
        res.send(task)
    } catch (err) {
        res.status(500).send(err)
    }

})

//Delete Task
router.delete('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id;
    const isValidId = mongoose.Types.ObjectId.isValid(_id)
    if (!isValidId) return res.status(400).send({ error: 'Invalid task ID' });

    try {
        const task = await Task.findOneAndDelete({ _id, owner: req.user._id })
        if (!task) return res.status(404).send({ error: 'No task found!' })
        res.send(task)
    } catch (err) {
        res.status(500).send(err);
    }
})

module.exports = router;