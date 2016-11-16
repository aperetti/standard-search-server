"use strict";

var express = require('express')
var multer = require('multer')
var path = require('path')
var router = express.Router({mergeParams: true})
var ms = require('ms')
var fs = require('fs')
var path = require('path')
var auth = require('../helpers/auth')
var pdftotext = require('pdftotextjs')
var spawn = require('child_process').spawn
var extract = require('pdf-text-extract')
var gfs = require('../helpers/gridfs')
var models = require('../orm')
var sequelize = require('sequelize')
/**
* @apiDefine AdminAccountRequired
*
* @apiError (400) {JSON} AdminAccountRequired Admin account is required.
*
* @apiErrorExample Error-Response:
*     HTTP/1.1 403 Permissions Denied
*     {
*       "error": "Admin account required!"
*     }
*/


var adminAuth = () => {
  return function (req, res, next) {
    var permissionDenied = () => res.status(403).send({success: false, message: 'Admin account required!'})
    var email = req.decodedToken.email
    models.userRole.find({
      where: {
        userEmail: email,
        roleType: 'Admin'
      }
    }).then((roles) => {
      if(roles) {
        next()
      } else {
        permissionDenied()
      }

    }).catch(permissionDenied)
  }
}

router.use(auth(), adminAuth())

/**
* @api {get} admin/is_admin/ Is Admin?
* @apiName IsAdmin
* @apiGroup Admin
* @apiPermission admin
* @apiVersion 0.1.0
* 
* @apiDescription Determines if a user is an admin using the JWT. This should be used for a check and not for security related operations.
* @apiDescription If the user is an admin, it simply returns a 200 status code.
* @apiParam {String} JWT Uses the JWT to determine if the user is admin.
*
* @apiSuccess (200) Returns a statsu of 200 if the User in the JWT is an admin
* @apiUse AdminAccountRequired
*/
router.get('/is_admin', function(req, res) {
  res.status(200).end()
})

// var storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.resolve('./app/temp'))
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname.toLowerCase(), cb)
//   }
// })

var storage = multer.memoryStorage()

function filefilter (req, file, cb) {
  if ( path.extname(file.originalname) === '.pdf') {
    req.isPdf = true
    console.log(file)
    req.filename = file.originalname.toLowerCase()
    cb(null, true)
  } else {
    req.isPdf = false
    cb(null, false)  
  }
}

var upload = multer({
  storage: storage,
  fileFilter: filefilter,
  onError : function(err, next) {
    console.log('error', err)
    next(err)
  }
})

var extractText = function(req, res, next) {
  if (req.body.file) {
    extract(appRoot+'/app/temp/'+req.body.filename, {splitPages: false}, function(err, text) {
    if (err) {
      console.dir(err)
      return
    }
    var re = /[A-Za-z]{2}\d{2}[A-Za-z]+|[A-Za-z]{1,2}\d{4}[A-Za-z]{0,3}/g
    var m
    var ar = []
    while (m = re.exec(text)) {
      if (ar.indexOf(m[0]) === -1) {
        ar.push(m[0])
      }
    }
    req.body.references = ar
    req.body.text = text
    next()
    })
  } else {
    next()
  }
}

/**
* @api {post} admin/add_standard/ Add Standard
* @apiName AddStandard
* @apiGroup Admin
* @apiPermission admin
* @apiVersion 0.1.0
* 
* @apiDescription Used to create a standard. This will save the standard to the database, store the uploaded file and index the result in ElasticSearch. The PDF text will be extracted and using the regex strings in the system. 
* @apiParam {String} code Standard Code (e.g. 1242.1023 or A0101)
* @apiParam {String} desc Standard description
* @apiParam {String} path Pipe deliminated "|" list of categories
* @apiParam {File} file The uploaded file (Type must be PDF)
* 
* @apiSuccess {Object} data JSON document which returns the following keys
* @apiSuccess {String} data.code Standard Code
* @apiSuccess {String} data.desc Standard Description
* @apiSuccess {String} data.file Standard File Name
* @apiSuccess {Array} data.menu Standard Array of the Path
* @apiSuccess {String} data.filename filename of the Standard file (converted to lower case)
* @apiSuccess {String} data.text extracted text from the pdf
* @apiSuccess {String} data.status Standard Status always returns "INACTIVE" when the standard is first created.
* @apiSuccess {Array} data.references An array of strings extracted from the PDF file based on the extract strings in the MongoDB databsae
* @apiUse AdminAccountRequired
* @apiError (406) {JSON} FailedMongoSave Returns an error if Mongo document fails to save
*/
function createStandard(code, desc, status, menu) {
  return models.standard.create({
    description: desc,
    code: code,
    status: status,
    menu_id: menu
  })
}

function createVersion(standard, desc, file, note) {
  return models.standardVersion.create({
    file: file,
    date: new Date(),
    note: note
  }).then(version => standard.addVersion(version))
}

router.post('/add_standard',
  upload.single('pdf'),
  extractText,
  function(req,res) {
    var code = req.body.code
    var desc = req.body.desc
    var file = req.file.buffer
    var menu = req.body.menu
    var status = req.body.status || 'ACTIVE'
    var changelog = req.body.changelog || 'Initial Creation'

    createStandard(code, desc, status, menu)
      .then((standard) => createVersion(standard, desc, file, changelog))
      .then((version) => res.status(301).redirect(`/standard/${code}`))
      .catch((err) => {
        console.log(err)
        res.status(415).json({success: false}).end()
      })
  })

/**
* @api {post} admin/edit_standard/ Edit Standard
* @apiName EditStandard
* @apiGroup Admin
* @apiPermission admin
* @apiVersion 0.1.0
* 
* @apiDescription Used to edit an existing standard. 
* @apiParam {String} code Standard Code (e.g. 1242.1023 or A0101)
* @apiParam {String} desc Standard description
* @apiParam {String} path Pipe deliminated "|" list of categories
* @apiParam {File} file The uploaded file (Type must be PDF)
* 
* @apiSuccess {Object} data JSON document which returns the following keys
* @apiSuccess {String} data.code Standard Code
* @apiSuccess {String} data.desc Standard Description
* @apiSuccess {String} data.file Standard File Name
* @apiSuccess {Array} data.menu Standard Array of the Path
* @apiSuccess {String} data.filename filename of the Standard file (converted to lower case)
* @apiSuccess {String} data.text extracted text from the pdf
* @apiSuccess {String} data.status Standard Status always returns "INACTIVE" when the standard is first created.
* @apiSuccess {Array} data.references An array of strings extracted from the PDF file based on the extract strings in the MongoDB databsae
* @apiUse AdminAccountRequired
* @apiError (406) {JSON} FailedMongoSave Returns an error if Mongo document fails to save
*/
  router.post('/edit_standard',
    upload.single('pdf'),
    extractText,
    function(req,res) {
      var update = {
        code: req.body.code,
        desc: req.body.desc,
        status: req.body.status,
        menu: req.body.menu,
      }
      cb() //WIP


      function cb (err,numAffected) { 
        if (err) {
          res.status(406).json({err: err}).end()
        } else {
          res.status(200).json({updated: numAffected}).end()
        }
      }
    })

/**
* @api {delete} deleteStandard Delete a Standard
* @apiName Delete
* @apiGroup Standard
* @apiPermission admin
* @apiVersion 0.1.0
* 
* @apiDescription Deletes the standard provided in the parameter
* @apiParam {String} standardId Standard ID
*
* @apiSuccess (200) {String} `Standard ${req.params.standardId} has been deleted.`
* 
* @apiError (400) {String} 'Error could not delete record.'
*
*/
router.delete('/delete/:standardId', (req,res) => {
  var removeId = req.params.standardId
  res.status(400).send('WIP Not Implemented')
})

/**
* @api {get} admin/get_references/ Get Regex References
* @apiName GetRegexReferences
* @apiGroup Admin
* @apiPermission admin
* @apiVersion 0.1.0
* 
* @apiDescription Returns an array of regex references.
* @apiDescription The regex reference is used to extract specific text from a PDF standard
* @apiDescription This allows users to search for specific references.
* @apiParam {String} JWT Uses the JWT to determine if the user is admin.
*
* @apiSuccess (200) Returns a list of references objects containing the keys group, regex, modifiers
* 
*/
router.get('/get_references', (req, res) => {
  return res.status(400).send('Error retrieving references')
})

/**
* @api {get} admin/get_references/ Get Regex References
* @apiName GetRegexReferences
* @apiGroup Admin
* @apiPermission admin
* @apiVersion 0.1.0
* 
* @apiDescription Returns an array of regex references.
* @apiDescription The regex reference is used to extract specific text from a PDF standard
* @apiDescription This allows users to search for specific references.
* @apiParam {String} JWT Uses the JWT to determine if the user is admin.
*
* @apiSuccess (200) Returns a list of references objects containing the keys group, regex, modifiers
* 
*/
router.post('/add_references', (req, res) => {
  return res.status(400).send('WIP Not Implemented')
})

router.post('/create_menu/', (req,res) => {
  var menu = req.body
  var errRes = (e) => {
    console.log(e)
    res.status(400).send('Invalid Input')
  }
  if (menu.name && menu.description)
  {
    var newMenu = null
    return models.menu.create({name: menu.name, description: menu.description})
      .then((m) => {
        newMenu = m
        if (menu.parentId)
          return m.setParent(menu.parentId)
        else
          return
      }).then(() => res.status(200).json(newMenu).end())
      .catch(errRes)
  }
  else{
    errRes()      
  }
})

router.delete('/delete_menu/:menu_id', (req,res) => {
  var force = req.body.force
  var menuId = req.params.menu_id
  var errRes = () => res.status(400).send('Invalid Input')
  function deleteMenu () {
    return models.menu.findById(menuId)
    .then(menu => {
      if (force) {
        menu.destroy()
        .then(() => res.status(200).send('Standard Delete'))
      } else {
        menu.getDescendents()
        .then(descendents => {
          var menus = [Number(menuId)]
          descendents.map( descendent => menus.push(descendent.id))
          models.standard.findAll({where: {menu_id: menus}})
          .then(standards => {
            if (!standards || standards.length === 0) {
              menu.destroy()
              .then(() => res.status(200).send('Standard Delete'))
            } else {
              return res.status(400).send('Menu could not be deleted. Menu or Menu descendents contain standards!')
            }
          }).catch(errRes)
        })
      }
    })
    .catch(errRes)  
  }

  deleteMenu() 
})

module.exports = router
