"use strict";

var express = require('express')
var multer = require('multer')
var path = require('path')
var router = express.Router({ mergeParams: true })
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
var tmp = require('tmp')
var es = require('../helpers/es')
var esRiver = es.river(models)
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
  return function(req, res, next) {
    var permissionDenied = () => res.status(403).send({ success: false, message: 'Admin account required!' })
    var email = req.decodedToken.email
    models.userRole.find({
      where: {
        userEmail: email,
        roleType: 'Admin'
      }
    }).then((roles) => {
      if (roles) {
        next()
      } else {
        permissionDenied()
      }

    }).catch(permissionDenied)
  }
}

router.use(adminAuth())

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

var upload = multer({
  storage: storage,
  fileFilter: filefilter,
  onError: function(err, next) {
    console.log('error', err)
    next(err)
  }
})

function filefilter(req, file, cb) {
  if (path.extname(file.originalname) === '.pdf') {
    req.isPdf = true
    req.filename = file.originalname.toLowerCase()
    cb(null, true)
  } else {
    req.isPdf = false
    cb(null, false)
  }
}



var extractText = function(req, res, next) {
  if (req.file) {
    tmp.file({ postfix: '.pdf' }, (err, path, fd, cleanUp) => {
      if (err) {
        console.log('ERROR: Could not generate temp')
        console.log(err)
        return next()
      }
      fs.writeFile(path, req.file.buffer, 'binary', (err, written, buffer) => {
        if (err) {
          console.log('ERROR: Could not write to temp file')
          console.log(err)
          return next()
        }
        extract(path, { splitPages: false }, function(err, text) {
          if (err) {
            console.log('ERROR: Could not extract text of PDF')
            console.log(err)
            return next()
          }
          req.body.text = text[0]
          next()
        })
      })
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
function createStandard(standard, t) {
  return models.standard.create(standard, { transaction: t })
}

function createVersion(standard, version, t) {
  return standard.createVersion(version, { transaction: t })
}

function updateVersion(standard, note, t) {
  return standard.getVersions({
    transaction: t,
    limit: 1,
    order: [
      ['createdAt', 'DESC']
    ]
  }).then(versions => {
    versions[0].note = note
    return versions[0].save({ transaction: t })
  })
}

function createReferences(standard, references, t) {
  console.log(references)
  return standard.setReferences(references, { transaction: t })
}

router.post('/add_standard',
  upload.single('pdf'),
  extractText,
  function(req, res) {
    var newStandard = {
      code: req.body.code,
      description: req.body.desc,
      menuId: req.body.menu,
      status: req.body.status || 'ACTIVE'
    }
    var newVersion = {
      file: req.file.buffer,
      text: req.body.text || '',
      note: req.body.changelog || 'Initial Creation'
    }
    var id
    var references = JSON.parse(req.body.references)
    references = Array.isArray(references) ? references : []

    models.sequelize.transaction(t => {
        return createStandard(newStandard, t)
          .then((standard) => {
            id = standard.id
            return createVersion(standard, newVersion, t)
              .then((version) => createReferences(standard, references, t))
          }).catch(e => {
            console.log(e)
          })
      })
      .then(() => esRiver.updateStandard(id))
      .then(() => res.status(301).redirect(`/standard/${id}`))
      .catch((err) => {
        console.log(err)
        res.status(500).json({ success: false }).end()
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
  function(req, res) {
    var update = {
      code: req.body.code,
      description: req.body.desc,
      status: req.body.status,
      menu: req.body.menu
    }
    var newVersion = {
      file: req.file && req.file.buffer,
      note: req.body.changelog,
      text: req.body.text || ''
    }

    var references = JSON.parse(req.body.references)
    references = Array.isArray(references) ? references : []

    models.sequelize.transaction(t => {
      return models.standard.findById(req.body.id, { transaction: t })
        .then(standard => {
          console.log(update)
          standard.set(update)
          return standard.save({ transaction: t })
            .then(() => models.standard.findById(req.body.id, { transaction: t }))
            .then(standard => {
              var versionPromise = newVersion.file ? createVersion(standard, newVersion, t) : updateVersion(standard, newVersion.note, t)
              return Promise.all([
                createReferences(standard, references, t),
                versionPromise
              ]).then(results => res.status(301).redirect(`/standard/${req.body.id}`))
            }).catch(e => {
              console.log(e)
              res.status(500).send('failed to update standard').end()
            })
        })
    }).then(() => esRiver.updateStandard(req.body.id))
  })

router.post('/process_pdf',
  upload.single('pdf'),
  extractText,
  function(req, res) {
    var text = req.body.text
    var matches = []
    var standards = []
    models.category.findAll()
      .then(cats => {
        var keywords
        for (var i = 0; i < cats.length; i++) {
          var name = cats[i].name
          if (cats[i].regex !== "") {
            var regex = new RegExp(cats[i].regex, 'g')
            var match
            while (match = regex.exec(text)) {
              var ref = match[0].trim()
              if (standards.indexOf(ref) === -1) {
                standards.push(ref)
                matches.push({ type: name, match: ref })
              }
            }
          }
        }
        return res.status(200).json(matches)
      }).catch(e => {
        console.log(e)
        res.status(500).send('Could not process PDF')
      })
  }
)

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
router.delete('/delete/:standardId', (req, res) => {
  var removeId = req.params.standardId
  res.status(400).send('WIP Not Implemented')
})

/**
 * @api {get} admin/categories/ Get Regex References
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
router.get('/categories', (req, res) => {
  models.category.findAll()
    .then(categories => {
      return res.status(200).json(categories)
    }).catch(err => {
      console.log(err)
      return res.status(500).send('Error retrieving references')
    })
})

/**
 * @api {get} admin/save_categories/ Get Regex References
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
router.post('/save_categories', (req, res) => {
  var types = req.body.types || {}
  models.sequelize.transaction(t => {
    return models.category.destroy({ where: { name: { $like: '%' } } }, { transaction: t })
      .then(del => {
        return models.category.bulkCreate(types, {
            fields: ['name', 'description', 'regex'],
            updateOnDuplicate: ['description', 'regex'],
            transaction: t
          })
          .then(inserted => {
            res.status(200).send('Updated category changes!')
          })
      })
  }).catch(e => {
    console.log(e)
    res.status(500).send('Could not save category changes!')
  })
})

router.post('/create_menu/', (req, res) => {
  var menu = req.body
  var errRes = (e) => {
    console.log(e)
    res.status(400).send('Invalid Input')
  }
  if (menu.name && menu.description) {
    var newMenu = null
    return models.menu.create({ name: menu.name, description: menu.description })
      .then((m) => {
        newMenu = m
        if (menu.parentId)
          return m.setParent(menu.parentId)
        else
          return
      }).then(() => res.status(200).json(newMenu).end())
      .catch(errRes)
  } else {
    errRes()
  }
})

router.post('/save_setting', (req, res) => {
  var id = req.query.id
  var value = req.body.setting
  console.log(value)
  models.setting.upsert({id: id, value: value})
    .then(inserted => {
      res.status(200).send('Settings Update!')
    }).catch((e) => {
      res.status(400).send('Could not update setting')
    })
})

router.delete('/delete_menu/:menu_id', (req, res) => {
  var force = req.body.force
  var menuId = req.params.menu_id
  var errRes = () => res.status(400).send('Invalid Input')

  function deleteMenu() {
    return models.menu.findById(menuId)
      .then(menu => {
        if (force) {
          menu.destroy()
            .then(() => res.status(200).send('Standard Delete'))
        } else {
          menu.getDescendents()
            .then(descendents => {
              var menus = [Number(menuId)]
              descendents.map(descendent => menus.push(descendent.id))
              models.standard.findAll({ where: { menuId: menus } })
                .then(standards => {
                  if (!standards || standards.length === 0) {
                    menu.destroy()
                      .then(() => res.status(200).send('Standard Delete'))
                  } else {
                    return res.status(400).send('Menu could not be deleted. Menu or Menu descendents contain standards!')
                  }
                }).catch(e => {
                  console.log(e)
                  errRes()
                })
            })
        }
      })
      .catch(errRes)
  }

  deleteMenu()
})

module.exports = router
