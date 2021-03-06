define({ "api": [
  {
    "type": "post",
    "url": "admin/add_standard/",
    "title": "Add a Standard",
    "name": "AddStandard",
    "group": "Admin",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.1.0",
    "description": "<p>Used to create a standard. This will save the standard to the database, store the uploaded file and index the result in ElasticSearch. The PDF text will be extracted and using the regex strings in the system.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "code",
            "description": "<p>Standard Code (e.g. 1242.1023 or A0101)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "desc",
            "description": "<p>Standard description</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "path",
            "description": "<p>Pipe deliminated &quot;|&quot; list of categories</p>"
          },
          {
            "group": "Parameter",
            "type": "File",
            "optional": false,
            "field": "file",
            "description": "<p>The uploaded file (Type must be PDF)</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "Object",
            "optional": false,
            "field": "data",
            "description": "<p>JSON document which returns the following keys</p>"
          }
        ],
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.code",
            "description": "<p>Standard Code</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.desc",
            "description": "<p>Standard Description</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.file",
            "description": "<p>Standard File Name</p>"
          },
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "data.menu",
            "description": "<p>Standard Array of the Path</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.filename",
            "description": "<p>filename of the Standard file (converted to lower case)</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.text",
            "description": "<p>extracted text from the pdf</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "data.status",
            "description": "<p>Standard Status always returns &quot;INACTIVE&quot; when the standard is first created.</p>"
          },
          {
            "group": "Success 200",
            "type": "Array",
            "optional": false,
            "field": "data.references",
            "description": "<p>An array of strings extracted from the PDF file based on the extract strings in the MongoDB databsae</p>"
          }
        ]
      }
    },
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "AdminAccountRequired",
            "description": "<p>Admin is required.</p>"
          }
        ],
        "406": [
          {
            "group": "406",
            "type": "JSON",
            "optional": false,
            "field": "error",
            "description": "<p>Returns an error if Mongo document fails to save</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 403 Permissions Denied\n{\n  \"error\": \"Admin account required!\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "./controllers/admin.js",
    "groupTitle": "Admin"
  },
  {
    "type": "get",
    "url": "admin/is_admin/",
    "title": "Determines if user is admin",
    "name": "IsAdmin",
    "group": "Admin",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "version": "0.1.0",
    "description": "<p>If the user is an admin, it simply returns a 200 status code.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "JWT",
            "description": "<p>Uses the JWT to determine if the user is admin.</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "optional": false,
            "field": "Returns",
            "description": "<p>a statsu of 200 if the User in the JWT is an admin</p>"
          }
        ]
      }
    },
    "filename": "./controllers/admin.js",
    "groupTitle": "Admin",
    "error": {
      "fields": {
        "400": [
          {
            "group": "400",
            "optional": false,
            "field": "AdminAccountRequired",
            "description": "<p>Admin is required.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 403 Permissions Denied\n{\n  \"error\": \"Admin account required!\"\n}",
          "type": "json"
        }
      ]
    }
  },
  {
    "type": "get",
    "url": "authenticate",
    "title": "Authenticates User Account",
    "name": "Authenticate",
    "group": "User",
    "permission": [
      {
        "name": "none"
      }
    ],
    "version": "0.1.0",
    "description": "<p>If the user is an admin, it simply returns a 200 status code.</p>",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "user",
            "description": "<p>Username</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "optional": false,
            "field": "password",
            "description": "<p>User's Password</p>"
          }
        ]
      }
    },
    "success": {
      "fields": {
        "200": [
          {
            "group": "200",
            "type": "JSON",
            "optional": false,
            "field": "Returns",
            "description": "<p>success boolean, time (ms), expiration time (ms), message, username, admin, and token</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 Permissions Denied\n{\n  \"success\": true,\n  \"time\": 1468289900241,\n  \"expires\": 1468293500241,\n  \"message\": \"Enjoy your token!\",\n  \"username\": \"testUser\",\n  \"admin\": true,\n  \"token\": \"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyIkX18iOnsic3RyaWN0TW9kZSI6dHJ1ZSwiZ2V0dGVycyI6e30sIndhc1BvcHVsYXRlZCI6ZmFsc2UsImFjdGl2ZVBhdGhzIjp7InBhdGhzIjp7ImZhdm9yaXRlcyI6ImRlZmF1bHQiLCJfX3YiOiJpbml0IiwiYWRtaW4iOiJpbml0IiwicGFzc3dvcmQiOiJpbml0IiwibmFtZSI6ImluaXQiLCJfaWQiOiJpbml0In0sInN0YXRlcyI6eyJpZ25vcmUiOnt9LCJkZWZhdWx0Ijp7ImZhdm9yaXRlcyI6dHJ1ZX0sImluaXQiOnsiX192Ijp0cnVlLCJhZG1pbiI6dHJ1ZSwicGFzc3dvcmQiOnRydWUsIm5hbWUiOnRydWUsIl9pZCI6dHJ1ZX0sIm1vZGlmeSI6e30sInJlcXVpcmUiOnt9fSwic3RhdGVOYW1lcyI6WyJyZXF1aXJlIiwibW9kaWZ5IiwiaW5pdCIsImRlZmF1bHQiLCJpZ25vcmUiXX0sImVtaXR0ZXIiOnsiZG9tYWluIjpudWxsLCJfZXZlbnRzIjp7fSwiX2V2ZW50c0NvdW50IjowLCJfbWF4TGlzdGVuZXJzIjowfX0sImlzTmV3IjpmYWxzZSwiX2RvYyI6eyJmYXZvcml0ZXMiOltdLCJfX3YiOjAsImFkbWluIjp0cnVlLCJwYXNzd29yZCI6InRlc3RwYXNzIiwibmFtZSI6InRlc3RVc2VyIiwiX2lkIjoiNTZkZDIzZDI2NTJjMWE0NDE5NzUyYWRjIn0sIl9wcmVzIjp7IiRfX29yaWdpbmFsX3NhdmUiOltudWxsLG51bGxdfSwiX3Bvc3RzIjp7IiRfX29yaWdpbmFsX3NhdmUiOltdfSwiaWF0IjoxNDY4Mjg5OTAwLCJleHAiOjE0NjgyOTM1MDB9.eFzeXCHGMuw8QpNzxVdNASk9fjfC8PaeDPard37_fmY\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "401": [
          {
            "group": "401",
            "type": "JSON",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>Returns {success: false, message: 'Authentication failed. User not found.' }</p>"
          },
          {
            "group": "401",
            "type": "JSON",
            "optional": false,
            "field": "InvalidPassword",
            "description": "<p>Returns {success: false, message: 'Authentication failed. Incorrect password.'}</p>"
          }
        ]
      }
    },
    "filename": "./controllers/api.js",
    "groupTitle": "User"
  }
] });
