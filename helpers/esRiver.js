var elasticsearch = require('elasticsearch')
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
})

module.exports = function() {
  return {
    indexStandard(id, body) {
      return client.exists({
        index: 'standards',
        type: 'standard',
        id: id
      }).then(exist => {
        if (!exist) {
          return client.index({
            index: 'standards',
            type: 'standard',
            id: id,
            body: body
          })
        } else {
          return client.update({
            index: 'standards',
            type: 'standard',
            id: id,
            body: body
          })
        }
      })
    },
    deleteStandard(id) {
      return client.delete({
        index: 'standards',
        type: 'standard',
        id: id
      })
    },
    indexStandardVersion(id, body) {
      return client.exists({
        index: 'standards',
        type: 'standard_version',
        id: id
      }).then(exist => {
        if (!exist) {
          return client.index({
            index: 'standards',
            type: 'standard_version',
            id: id,
            body: body
          })
        } else {
          return client.update({
            index: 'standards',
            type: 'standard_version',
            id: id,
            body: body
          })
        }
      })
    },
    deleteStandardVersion(id) {
      return client.delete({
        index: 'standards',
        type: 'standard_version',
        id: id
      })
    }
  }
}
