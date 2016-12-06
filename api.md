#Standard-Search API

##API

####POST authenticate/
Authenticates a user and returns a token with expiration. Token is signed with the secret key specified in /config.js

######Parameters
``` javascript
body = {
	name: YOUR_USERNAME,
	password: YOUR_PASSWORD
	}
```
######Response
Succesful:
``` javascript
	response = {
		success: true,
		time: date,
		expires: date + ms(tokenExpiration), 
		message: 'Enjoy your token!',
		token: token
    }
```
Incorrect Password:
``` javascript
	response = {
		success: false,		
		message: 'Authentication failed. Wrong password.',
    }
```
No User Exists:
``` javascript
	response = {
		success: false,		
		message: 'Authentication failed. User not found.',
    }
```

####
