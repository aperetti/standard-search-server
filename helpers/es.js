var elasticsearch = require('elasticsearch')
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
})
module.exports = {
  client() {
    return client
  },
  river(models) {
    return {
      updateStandard(id) {
        return models.standard.findById(id, {
          include: [
            { model: models.standardVersion, as: 'versions', attributes: { exclude: ['file'] }, order: [
                ['createdAt', 'DESC']
              ], limit: 1 }
          ]
        }).then(standard => {
          if (!standard) return Promise.reject('Standard does not exist ' + id)
          var body = {
            code: standard.code,
            description: standard.description,
            status: standard.status,
            text: (standard.versions.length > 0 && standard.versions[0].text) || ''
          }
          return client.index({
            index: 'standards',
            type: 'standard',
            id: id,
            body: body
          })
        }).catch(err => {
          console.log(err)
          return false
        })
      },
      deleteStandard(id) {
        return client.delete({
          index: 'standards',
          type: 'standard',
          id: id
        })
      }
    }
  }
}
