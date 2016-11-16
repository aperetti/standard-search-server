"use strict";

var express = require('express')
var router = express.Router({mergeParams: true})
var ms = require('ms')
var fs = require('fs')
var Project = require('../models/project')
var path = require('path')
var auth = require('../helpers/auth')
var models = require('../orm')

router.use(auth())

router.post('/add_history/:standard_id', (req, res) => {
  models.user.findById(req.decodedToken.email)
  .then((user) => user.addHistory(req.params.standard_id))
  .then((history) => {
    return res.status(200).send()
  }).catch((err) => {
    return res.status(400).send(err)
  })
  // MONGO API
  // var userId = req.decodedToken._doc._id
  // var standardId = req.params.standard_id
  // User.addHistory(userId, standardId, function (err, user) {
  //   if (err) {
  //     return res.status(400).send(err)
  //   }
  //   return res.status(200).json(user.history)
  // })
})

router.get('/get_history/', (req, res) => {

  models.user.findById(req.decodedToken.email)
  .then((user) => {
    user.getHistory().then((history) =>{
      return res.status(200).json(history);
    }).catch((err) => {
      return res.status(400).send(err);
    })
  })

  // MONGO API
  // var userId = req.decodedToken._doc._id

  // User.getHistory(userId, (err, history) => {
  //   if (err) {
      
  //   }
  //   return res.status(200).json(history)
  // })
})

router.post('/projects/toggle_standard/:project_id/:standard_id', (req, res) => {
  var userId = req.decodedToken.email
  var projectId = req.params.project_id
  var standardId = req.params.standard_id

  //Verify User owns project
  models.project.findById(projectId)
  .then(project => {
    if (project.ownerId !== userId) throw 'Owner Not Valid'
    return project.hasStandard(standardId)
    .then(exists => {
      if (exists) {
        return project.removeStandard(standardId)
      } else {
        return project.addStandard(standardId)
      }
    })
  }).then(() => res.status(200).send('Standard Affected'))
  .catch(err => {
    console.log(err)
    res.status(400).send(err)
  })
})

router.get('/projects/owned_projects/', function (req, res) {
  models.user.findById(req.decodedToken.email)
  .then((user) => user.getProjects())
  .then(projects => res.status(200).json(projects))
  .catch(() => res.status(400).send('Invalid Request'))
})

// Retrieves a users projects, and then checks if the project contains the standard_id.
router.get('/projects/owned_projects/:standard_id', function (req, res) {
  models.project.findAll({
    where: {ownerId: req.decodedToken.email},
    include: [{
      model: models.standard,
      as:'standards',
      where: {code: req.params.standard_id},
      required: false
    }]
  })
  .then(projects => res.status(200).json(projects))
  .catch((e) => {
    console.log(e)
    res.status(400).send('Invalid Request')
  })
  })

  // var userId = ObjectId(req.decodedToken._doc._id)
  // Project.find({owners: userId}).select( '_id name description standards').exec(function(err, projects) {
  //   var resProjects = []
  //   for (var i in projects) {
  //     var project = projects[i].toJSON()
  //     console.log(project)
  //     console.log(project.standards[0] === ObjectId(req.params.standard_id))
  //     console.log(req.params.standard_id)

  //     // Find a match with the standard_id param and the projects standards.
  //     if (project.standards && project.standards.find((standard) => standard.toString() === req.params.standard_id )) {         
  //       project.hasStandard = true
  //     } else {
  //       project.hasStandard = false
  //     }
  //     project.standards = undefined
  //     resProjects.push(project)
  //   }
  //   console.log(resProjects)
  //   if (!err) return res.status(200).json(resProjects)
  //   res.status(400).send('Invalid Request')
  // })

router.get('/projects/by_id/:project_id', function (req, res) {
  var projectId = req.params.project_id
  models.project.findById(projectId, {
    include: [{
      model: models.standard,
      as:'standards',
      include: [{
        model: models.menu,
        as: 'menu',
        include: [{ model: models.menu, as: 'ancestors'}],
        order: [[{ model: models.menu, as: 'ancestors' }, 'hierarchyLevel']]
      }]
    }]
  }).then(projects => res.status(200).json(projects))
  .catch(e => {
    console.log(e)
    res.status(400).send('Error Retrieving Project')
  })

})

router.delete('/projects/delete_project/:project_id', (req, res) => {
  models.project.findById(req.params.project_id)
  .then(task => task.destroy())
  .then(() => res.status(200).send('Project Deleted'))
  .catch(e => {
    console.log(e)
    res.status(400).send('Project Deletion Failed')
  })
})

router.post('/projects/create_project/:project_name', (req, res) => {
  var project = {}
  project.name = req.params.project_name    
  project.owner = req.decodedToken.email
  if (req.body) {
    project.description = req.body.description || ''
    project.standards = req.body.standard_ids || [] 
  }
  models.user.findById(project.owner)
  .then(user => {
    return models.project.create({name: project.name, description: project.description})
    .then(dbProj => {
      if (project.standard && project.standards.length) {
        return dbProj.addStandards(standards)
          .then(() => user.addProject(dbProj))
      } else {
        return user.addProject(dbProj)
      }
    })
  }).then(() => res.status(200).send('Project created successfully!'))
  .catch(e => {
    console.log(e)
    res.status(400).send('Error creating Project')
  })
})

router.post('/projects/edit_project/:project_id', (req, res) => {
  return res.status(400).send('WIP Not Implemented')
})

module.exports = router
