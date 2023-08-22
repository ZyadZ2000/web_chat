# Description

A web chat application built with Node.js, Express, Socket.io, and React.

Includes features such as: authentication, validation, authorization, private messaging, and group messaging, user friends, and more.

This repository includes both the back-end and front-end of the project.

# API Documentation

This is a documentaion of the API provided by the server.

# Authentication Routes

## POST /auth/signup

Create a new user account by providing the required information.

#### Request Body

The request body must be a JSON object containing the following fields:

- `email`: A valid and unique email address for the user.
- `password`: A password with a minimum length of 6 characters and a maximum length of 30.
- `passwordConfirm`: Must match the password provided.
- `username`: A unique username with a minimum of 3 characters and a maximum of 20.
- (Optional) `profilePhoto`: A file that can be sent with the HTTP request to be used as the user's profile picture.

Example request body:

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "passwordConfirm": "securepassword",
  "username": "myusername"
}
```

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 409:** Conflict due to duplicate email or username. The response will include the message `"email or username already used!"`.
- **Status 201:** User created successfully. The response will include the message `"User created successfully"`.
- **Status 500:** Server Error. The response will include the error information.

## POST /auth/login

Login to an existing user account by providing the required information.

### Request Body

The request body must be a JSON object containing the following fields:

- `email`: A valid email address for the user.
- `password`: A password with a minimum length of 6 characters and a maximum length of 30.

Example request body:

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 200:** User logged in. The response will include the jsonwebtoken in the field "token", and the user data in the field "user".
- **Status 500:** Server Error. The response will include the error information.

## POST /auth/reset/password

Reset the password for an existing user account by providing the user email.

### Request Body

The request body must be a JSON object containing the following fields:

- `email`: A valid email address for the user.

Example request body:

```json
{
  "email": "user@example.com"
}
```

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 404:** User not found. The response will include the message `"user not found"`.
- **Status 200:** An email is sent to the user with a link to reset the password. along with the message `"Email sent successfully"`.
- **Status 500:** Server Error. The response will include the error information.

## GET /auth/reset/:resetToken _Token is valid for one hour from seding it to the email_

The reset form sent to the user email.

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 500:** Server Error. The response will include the error information.
- **Status 200:** The reset form.

## POST /auth/reset/confirm

Confirm the password reset.

### Request Body

The request body must be a JSON object containing the following fields:

- `email`: A valid email address for the user.
- `password`: A password with a minimum length of 6 characters and a maximum length of 30.
- `passwordConfirm`: Must match the password provided.
- `resetToken`: The token sent to the user's email.

Example request body:

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "passwordConfirm": "securepassword",
  "resetToken": "resetTokenValue"
}
```

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 404:** User not found. The response will include the message `"user not found"`.
- **Status 500:** Server Error. The response will include the error information.
- **Status 200:** Password reset successfully.

# User Routes

## GET /user/profile

Get the profile info using the jsonwebtoken.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Response

- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** User not found. The response will include the message `"user not found"`.
- **Status 200:** The user profile info.
- **Status 500:** Server Error. The response will include the error information.

## GET /user/view/:username

Get the profile info of a user by providing the username in the request params.

### Response

- **Status 400:** Validation error. The response will include detailed error information.
- **Status 404:** User not found. The response will include the message `"user not found"`.
- **Status 200:** The user profile info.
- **Status 500:** Server Error. The response will include the error information.

## GET /user/friends

Get the friends list of the user using the jsonwebtoken.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Response

- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** User or Friends not found.
- **Status 200:** The user friends list.
- **Status 500:** Server Error, The response will include the error information.

## GET /user/chats

Get the chats list of the user using the jsonwebtoken.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Response

- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** User or Chats not found.
- **Status 200:** The user chats list.
- **Status 500:** Server Error, The response will include the error information.

## GET /user/requests/received

Get the requests received by the user.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Response

- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** Requests not found. The response will include the message `No received requests"`.
- **Status 200:** The user received requests list.
- **Status 500:** Server Error, The response will include the error information.

## GET /user/requests/sent

Get the requests sent by the user.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Response

- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** Requests not found. The response will include the message `"No sent requests"`.
- **Status 200:** The user received requests list.
- **Status 500:** Server Error, The response will include the error information.

## GET /user/search

Search for users by username.

`If username not provided in the request query, all users will be returned`

### Response

- **Status 400:** Validation error. The response will include detailed error information.
- **Status 404:** Users not found.
- **Status 200:** list of users
- **Status 500:** Server Error. The response will include the error information.

## PUT /user/email

Change the user email.

### Request Body

The request body must be a JSON object containing the following fields:

- `email`: A valid and unique email address for the user.
- `password`: A password with a minimum length of 6 characters and a maximum length of 30.
- `newEmai`: A valid and unique email address for the user.

Example request body:

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "newEmail": "newemail@example.com"
}
```

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** User not found. The response will include the message `"user not found"`.
- **Status 409:** Conflict due to duplicate email. The response will include the message `"email already used!"`.
- **Status 200:** Email changed successfully.
- **Status 500:** Server Error, The response will include the error information.

## PUT /user/username

Change the user username.

### Request Body

The request body must be a JSON object containing the following fields:

- `email`: A valid and unique email address for the user.
- `password`: A password with a minimum length of 6 characters and a maximum length of 30.
- `newUsername`: A valid and unique username for the user of minimum length 3 characters, and maximum length of 30.

Example request body:

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "newUsername": "newusername"
}
```

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** User not found. The response will include the message `"user not found"`.
- **Status 409:** Conflict due to duplicate username. The response will include the message `"username already used!"`.
- **Status 200:** Username changed successfully.
- **Status 500:** Server Error, The response will include the error information.

## PUT /user/password

Change the user password.

### Request Body

The request body must be a JSON object containing the following fields:

- `email`: A valid and unique email address for the user.
- `password`: A password with a minimum length of 6 characters and a maximum length of 30.
- `newPass`: A password with a minimum length of 6 characters and a maximum length of 30.
- `newPassConfirm`: Must match the newPass provided.

Example request body:

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "newPass": "newsecurepassword",
  "newPassConfirm": "newsecurepassword"
}
```

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** User not found. The response will include the message `"user not found"`.
- **Status 200:** Password changed successfully.
- **Status 500:** Server Error, The response will include the error information.

## PUT /user/bio

Change the user bio.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Request Body

The request body must be a JSON object containing the following fields:

- `bio`: A bio of maximum length of 1000 characters.

Example request body:

```json
{
  "bio": "new bio"
}
```

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 200:** Bio changed successfully.
- **Status 500:** Server Error, The response will include the error information.

## PUT /user/photo

Change the user photo.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Request Body

`profilePhoto`: A file that can be sent with the HTTP request to be used as the user's profile picture.

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 200:** Profile Photo changed successfully.
- **Status 500:** Server Error, The response will include the error information.

# Chat Routes

## GET /chat/

Get the chat info and messages

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Request Body

The request body must be a JSON object containing the following fields:

- `chatId`: The MongoDB ObjectId of the chat to fetch from the database.

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** Chat not found or not accessible to the user due to not being a member.
- **Status 200:** Chat found an sent in the `chat` field.
- **Status 500:** Server Error, The response will include the error information.

## GET /chat/search

Search for group chats by their name.

`If name not provided in the request query, all group chats will be returned`

### Response

- **Status 400:** Validation error. The response will include detailed error information.
- **Status 404:** Chats not found.
- **Status 200:** list of found chats.
- **Status 500:** Server Error. The response will include the error information.

## GET /chat/requests

Get the chat sent invites or received join requests.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Request Body

The request body must be a JSON object containing the following fields:

- `chatId`: The MongoDB ObjectId of the chat to fetch from the database.

### Response

- **Status 400:** Validation error. The response will include detailed error information.
- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 402:** Chat not found, or the client isn't authorized.
- **Status 404:** Requests not found.
- **Status 200:** list of found requests.
- **Status 500:** Server Error. The response will include the error information.

## POST /chat/create

Create a group chat room.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Request Body

The request body must be a JSON object containing the following fields:

- `chatName`: Must be a string with minimum length of 3 characters and maximum of 30.
- (Optional) `chatDescription`: Must be a string with minimum length of 1 characters and maximum of 256.
- (Optional) `chatPhoto`: A file that can be sent with the HTTP request to be used as the chat's photo.

Example request body:

```json
{
  "chatName": "newChatName",
  "chatDescription": "description"
}
```

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 201:** Chat created successfully, the response will include the chat info in the `chat` field.
- **Status 500:** Server Error, The response will include the error information.

# Request Routes

## DELETE /request/

Delete the sent requets either by the sender or one of the chat admins.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Request Body

The request body must be a JSON object containing the following fields:

- `requestId`: The MongoDB ObjectId of the request to delete from the database.

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 404:** Request not found.
- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 402:** Request not deleted due to being unauthorized.
- **Status 200:** Request deleted successfully.
- **Status 500:** Server Error, The response will include the error information.
