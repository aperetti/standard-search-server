"use strict";

var express = require('express');
var router = express.Router({mergeParams: true})
var ms = require('ms');
var fs = require('fs');
var path = require('path')
var auth = require('../helpers/auth')
var gfs = require('../helpers/gridfs')
var elasticsearch = require('elasticsearch');
var sequelize = require('sequelize')
var models = require('../orm')
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

function $ (msg) {
  return console.log(new Date().getSeconds() + ': '+msg)
}
 
router.get('/pdf/:standard_id', (req,res) => {
  var standardId = req.params.standard_id;
  // $('getting standard')
  models.standard.findById(standardId)
  .then(standard => {
    return standard.getVersions({
      limit: 1,
      order: [ [ 'createdAt', 'DESC']]
    })
  }).then(version => {
    // $('got version')
    if (version.length == 0) return res.status(400).send('Error could not find Standard')
    res.writeHead(200, {'Content-Type': 'application/pdf'})
    res.end(new Buffer(version[0].file, 'binary'))
    // $('sent file')
  }).catch((e) => {
    console.log(e)
    res.status(400).json({message: 'Query failed, see API documents (standards/pdf/:standard_id) .', error: e})
  })
})

router.get('/pdf/:standard_id/:revision_id', (req,res) => {
  var standardId = req.params.standard_id;
  var sv_id = req.params.sv_id
  models.standardVersion.findById(sv_id)
  .then(version => {
    res.writeHead(200, {'Content-Type': 'application/pdf'})
    res.end(new Buffer(version[0].file, 'binary'))
  }).catch((e) => {
    console.log(e)
    res.status(400).json({message: 'Query failed, see API documents (standards/pdf/:standard_id/:revision_id) .', error: e})
  })
})

router.get('/nonce/:standard_id', (req, res) => {
  var standardId = req.params.standard_id;
  models.tempStandard.create().then(nonce => {
    res.status(200).send(nonce.id)
  })
})

router.get('/revisions/:standard_id', (req, res) => {
  var standardId = req.params.standard_id
  models.standard.findById(standardId)
  .then(standard => {
    return standard.getVersions({
    order: [ [ 'createdAt', 'DESC']],
    attributes: {exclude: ['file']}
  })}).then(versions => {
    res.status(200).json(versions)
  }).catch(err => {
    console.log(err)
    res.status(400).send('Error retrieving standard Changes')
  })
})

router.get('/es', (req, res) => req.status(200).end())

router.get('/all', (req, res) => {
  res.status(400).send('WIP Not Implemented')
});

router.get('/lookup/:standard_id', (req, res) => {
  var standardId = req.params.standard_id
  models.standard.findOne({
    where: {code: standardId},
    include: [
        {model: models.standardVersion, as: 'versions', attributes: {exclude: ['file']}},
        {model: models.standard, as: 'references', attributes: ['code', 'description']},
        {model: models.standard, as: 'referrers', attributes: ['code', 'description']},
    ]}
  ).then(standard => res.status(200).json(standard))
  .catch(err => {
    console.log(err)
    res.status(400).send('Could not retrieve standard!')
  })
})

/* 
* Validates if a standard exists. 
*/
router.get('/valid_standard/:code', function(req, res) {
  models.standard.findById(req.params.code)
    .then(standard => res.status(200).json(standard).end())
})


router.get('/menu/:id', (req, res) => {
  console.log(req.params.id)
  var includes = [
    {model: models.menu, as: 'parent'},
    {model: models.menu, as: 'children'},
    {model: models.standard, as: 'standards'},
    {model: models.menu, as: 'ancestors'}
  ]
  
  if (req.params.id == 0 || req.params.id == 'null' || req.params.id == 'undefined') {
    models.menu.findAll({where: {parentId: {$eq: null}}, include: includes})
    .then(menu => res.status(200).json(menu))
    .catch((err) => res.status(400).send('Query Error'))  
  } else {
    models.menu.findById(req.params.id, {include: includes})
    .then(menu => res.status(200).json(menu))
    .catch((err) => res.status(400).send('Query Error'))  
  }
})

/**
* @api {post} search Search for a Standard
* @apiName Search
* @apiGroup Standard
* @apiPermission user
* @apiVersion 0.1.0
* 
* @apiDescription Uses ElasticSearch to return searched Standards
* @apiParam {String} fields Fields which to look up the search string
* @apiParam {String} search Search String 
*
* @apiSuccess (200) {JSON} Returns a list of search results which contains the ID and relevant information
* 
* @apiSuccessExample Success-Response:
*
* @apiError (400) {String} SearchError Returns 'Error retrieving search results. Check sytnax'
**/
router.post('/search/', (req,res) => {
  client.search({
    index: 'standards',
    type: 'standard',
    body: {
      sort: [{_score: 'desc'}],
      query: {
        multi_match: {
          fields: req.body.fields,
          query: req.body.search,
          fuzziness: 2
        }
      }
    }
  }).then((esRes) => {
    res.status(200).json(esRes.hits.hits).send()
  }, (esErr) => {
    res.status(400).send('Error retrieving search results. Check sytnax')
  })
})

module.exports = router
