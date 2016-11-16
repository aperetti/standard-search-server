"use strict";

var express = require('express')
var app = module.exports = express()
var bodyParser = require('body-parser')
var morgan = require('morgan')
var mongoose = require('mongoose')
var path = require('path')
var config = require('./config')
var api = require('./controllers/api')
var User = require('./models/user')
var models = require('./orm')
var mysql = require('mysql')
var fs = require('fs')
mysql.createConnection(config.sqlDb.connect)
global.appRoot = path.resolve(__dirname)

global.ObjectId = function(id) {
  if (/[a-f0-9]{24}/.test(id)) return mongoose.Types.ObjectId(id)
  return null
}

//Configuration
var port = process.env.PORT || 8080;
mongoose.connect(config.database, { mongos: true });
module.exports.mongoose = mongoose
console.log("Mongoose Connection Status: " + mongoose.connection.readyState);
app.set('apiSecret', config.secret);

//use body parser so we can get infor from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false  }));
app.use(bodyParser.json());

app.use(function (error, req, res, next) {
  if (error instanceof SyntaxError) {
    res.status(400).json({error: 'Malformed Request - See Body', res: error}).send()
  } else {
    next();
  }
});

// use morgan to log request to the console
app.use(morgan('dev'));

app.use('/_api', express.static('apidoc'))
app.get('/_api', function(req,res){
  res.sendFile(__dirname + '/apidoc/')
});

app.use('/api', api);

models.sequelize.sync({force: false}).then(() => {
  // Creating Initial Data
  console.log('Initializing Data...')
  initalizeData()

  app.listen(port);
  console.log('Magic happens at http://localhost:' + port);
})

function initalizeData() {
  return models.user.upsert(config.defaultUsers[0])
  .then(models.user.upsert(config.defaultUsers[1]))
  .then(models.role.upsert({type: 'Admin'}))
  // Create Menu
  .then(() => {
    return models.menu.findAll({where: {name: 'Standards'}})
      .then(menu => {
        if (!menu || menu.length === 0)
        {
        return models.menu.upsert({name: 'Standards', description: 'All Standards'})
        .then(menu => {
          return models.menu.create({name: 'Compatible Units' , description: 'Building Blocks'})
            .then(child => child.setParent(menu)
              .then(() => models.menu.create({name: 'Anchors', description: 'Holding'})
                .then(anchors => anchors.setParent(child))
                .then(() => models.menu.create({name: 'Transformers', description: 'Robots in Disguise'})
                  .then(transformers => transformers.setParent(child))
                )
              )          
            )
          })
        } else {
          return
        }
    })
  })
  // Creates Standard
  .then(() => models.standard.upsert({
    code: 'A0101', description: '8" Single Helix Anchor', status: 'ACTIVE'}))
  .then((inserted) => {
    if (inserted) {
      return models.standard.findById('A0101')
      .then(standard => standard.setMenu('3'))  
    } else {
      return
    }
  })
  // Creates Initial Standards Version
  .then((standard) => {
    models.standard.findById('A0101',{
      include: {model: models.standardVersion, as: 'versions'}
    }).then(standard => {
      if (standard.versions.length > 0){
        return
      } else {
        return fs.readFile('test/test.pdf', (err, data) => {
          if (err) {
            throw err
          } else {
            return models.standardVersion.create({
              text: '',
              file: data,
              note: 'Initial Creation of the File'
            }).then(version => standard.addVersion(version))
          }
        })
      }
    })
  })
  .then(() => models.role.findById('Admin'))
  .then((role) => role.addUser('admin@test.com'))
  // Adds Project for User
  .then(() => models.user.findById('admin@test.com',{
    include: {model: models.project}
  }))
  .then(user => {
    if (user.projects.length > 0) {
      return
    } else {
    return models.project.create({
      name: 'User Project',
      description: 'Example User Project'
    }).then(project => {
      return user.addProject(project).then(user => {
        return project.addStandards(['A0101'])
      })
    })
    }
  })
  .then(() => console.log('Data Initialize'))
  .catch((error) => console.log(error))
}
