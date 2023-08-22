# Description

A web chat application built with Node.js, Express, MongoDB, Socket.io, and React.

Includes features such as: authentication, validation, authorization, private messaging, and group messaging, user friends, and more.

This repository includes both the back-end and front-end of the project. (Front-end is yet to be implemented)

# API Documentation

This is a documentaion of the API provided by the server.

# Authentication Routes

## POST `/auth/signup`

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

## POST `/auth/login`

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

## POST `/auth/reset/password`

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

## GET `/auth/reset/:resetToken` _Token is valid for one hour from seding it to the email_

The reset form sent to the user email.

### Response

- **Status 400:** Validation errors. The response will include detailed error information.
- **Status 500:** Server Error. The response will include the error information.
- **Status 200:** The reset form.

## POST `/auth/reset/confirm`

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

## GET `/user/profile`

Get the profile info using the jsonwebtoken.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Response

- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** User not found. The response will include the message `"user not found"`.
- **Status 200:** The user profile info.
- **Status 500:** Server Error. The response will include the error information.

## GET `/user/view/:username`

Get the profile info of a user by providing the username in the request params.

### Response

- **Status 400:** Validation error. The response will include detailed error information.
- **Status 404:** User not found. The response will include the message `"user not found"`.
- **Status 200:** The user profile info.
- **Status 500:** Server Error. The response will include the error information.

## GET `/user/friends`

Get the friends list of the user using the jsonwebtoken.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Response

- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** User or Friends not found.
- **Status 200:** The user friends list.
- **Status 500:** Server Error, The response will include the error information.

## GET `/user/chats`

Get the chats list of the user using the jsonwebtoken.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Response

- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** User or Chats not found.
- **Status 200:** The user chats list.
- **Status 500:** Server Error, The response will include the error information.

## GET `/user/requests/received`

Get the requests received by the user.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Response

- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** Requests not found. The response will include the message `No received requests"`.
- **Status 200:** The user received requests list.
- **Status 500:** Server Error, The response will include the error information.

## GET `/user/requests/sent`

Get the requests sent by the user.

`The jsonwebtoken must be sent in the Authorization header as a Bearer token`

### Response

- **Status 401:** Authentication failed. The response will include the message `"Not Authenticated"`.
- **Status 404:** Requests not found. The response will include the message `"No sent requests"`.
- **Status 200:** The user received requests list.
- **Status 500:** Server Error, The response will include the error information.

## GET `/user/search`

Search for users by username.

`If username not provided in the request query, all users will be returned`

### Response

- **Status 400:** Validation error. The response will include detailed error information.
- **Status 404:** Users not found.
- **Status 200:** list of users
- **Status 500:** Server Error. The response will include the error information.

## PUT `/user/email`

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

## PUT `/user/username`

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

## PUT `/user/password`

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

## PUT `/user/bio`

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

## PUT `/user/photo`

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

## GET `/chat/`

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

## GET `/chat/search`

Search for group chats by their name.

`If name not provided in the request query, all group chats will be returned`

### Response

- **Status 400:** Validation error. The response will include detailed error information.
- **Status 404:** Chats not found.
- **Status 200:** list of found chats.
- **Status 500:** Server Error. The response will include the error information.

## GET `/chat/requests`

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

## POST `/chat/create`

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

## DELETE `/request/`

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

# Socket.io APIs

`Connection to the socket.io server must be authenticated using the jsonwebtoken, and the token must be kept in the handshake auth of every socket.io request`

# User APIs

## EVENT: `user:removeFriend`

Removes a friend from the user's friends list.

### Request

- **Data Object:**

  - `friendId` (MongoDB ObjectId) - The ObjectId of the friend to be removed from the user's friends list.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `false`.
  - `error` (string) - A description of the error. Possible errors include the friend not being found or the user not being a friend.

- **Success:**

  If the operation is successful, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `true`.

- **Emit (In Case of Success):**

  After successfully removing the friend, a `user:removeFriend` event will be emitted to the removed friend's socket, containing information about the requesting user.

## EVENT: 'user:delete'

Delete the user account.

### Request

- **Data Object:**

  - `email` - The email of the user.
  - `password` - The password of the user.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `false`.
  - `error` (string) - A description of the error. Possible errors include validation errors and failed authentication.

- **Success:**

  If the operation is successful, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `true`.

- **Emit (In Case of Success):**

  After successfully deleting the account, a `user:delete` event will be emitted to all of the users, containing information about the deleted user.

# Chat APIs

## EVENT: `chat:join`

Join the socket to tha chat room to receive notifications.

### Request

- **Data Object:**

  - `chatId` (MongoDB ObjectId) - The ObjectId of the chat to join.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `false`.
  - `error` (string) - A description of the error. Possible errors include the chat not being found or the user not being a member.

- **Success:**

  If the operation is successful, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `true`.

## EVENT: `chat:sendMessage`

Send a message to the chat.

### Request

- **Data Object:**

  - `chatId` (MongoDB ObjectId) - The ObjectId of the chat to send the message to.
  - `messageContent` (string) - The message to be sent.
  - `messageType`: The type of the message, can be either `text` or `file`.
  - (Optional) `file`: A file that can be sent with the HTTP request to be used as the message's file. Files are limited to images, videos, and voice recordings.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `false`.
  - `error` (string) - A description of the error. Possible errors include the chat not being found or the user not being a membe or validation errors.

- **Success:**

  If the operation is successful, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `true`.
  - `message` (object) - The message object.

- **Emit (In Case of Success):**

  After successfully sending the message, a `chat:sendMessage` event will be emitted to all of the chat members, containing information about the message.

## EVENT: `chat:addAdmin`

Make one of the members an admin of the chat. (Only the creator is authorized)

### Request

- **Data Object:**

  - `chatId` (MongoDB ObjectId) - The ObjectId of the chat to add the admin to.
  - `adminId` (MongoDB ObjectId) - The ObjectId of the user to be added as an admin.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `false`.
  - `error` (string) - A description of the error. Possible errors include the chat not being found or the user not being a member or the client not being authorized.

- **Success:**

  If the operation is successful, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `true`.

- **Emit (In Case of Success):**

  After successfully adding the admin, a `chat:addAdmin` event will be emitted to all of the chat members, containing information about the new admin.

## EVENT: `chat:removeAdmin`

Remove one of the admins of the chat. (Only the creator is authorized)

### Request

- **Data Object:**

  - `chatId` (MongoDB ObjectId) - The ObjectId of the chat to remove the admin from.
  - `adminId` (MongoDB ObjectId) - The ObjectId of the user to be removed as an admin.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `false`.
  - `error` (string) - A description of the error. Possible errors include the chat not being found or the user not being a member or the client not being authorized.

- **Success:**

  If the operation is successful, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `true`.

- **Emit (In Case of Success):**

  After successfully removing the admin, a `chat:removeAdmin` event will be emitted to all of the chat members, containing information about the removed admin.

## EVENT: `chat:removeMember`

Remove one of the members of the chat. (Only the creator and admins are authorized)

### Request

- **Data Object:**

  - `chatId` (MongoDB ObjectId) - The ObjectId of the chat to remove the member from.
  - `memberId` (MongoDB ObjectId) - The ObjectId of the user to be removed as a member.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `false`.
  - `error` (string) - A description of the error. Possible errors include the chat not being found or the user not being a member or the client not being authorized.

- **Success:**

  If the operation is successful, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `true`.

- **Emit (In Case of Success):**

  After successfully removing the member, a `chat:removeMember` event will be emitted to all of the chat members, containing information about the removed member.

## EVENT: `chat:changeName`

Change the name of the chat. (Only the creator is authorized)

### Request

- **Data Object:**

  - `chatId` (MongoDB ObjectId) - The ObjectId of the chat to change the name of.
  - `chatName` (string) - The new name of the chat.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `false`.
  - `error` (string) - A description of the error. Possible errors include the chat not being found or the user not being a member or the client not being authorized or validation errors.

- **Success:**

  If the operation is successful, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `true`.

- **Emit (In Case of Success):**

  After successfully changing the name, a `chat:changeName` event will be emitted to all of the chat members, containing information about the new name.

## EVENT: `chat:changePhoto`

Change the photo of the chat. (Only the creator is authorized)

### Request

- **Data Object:**

  - `chatId` (MongoDB ObjectId) - The ObjectId of the chat to change the photo of.
  - `file` (file) - The new photo of the chat.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `false`.
  - `error` (string) - A description of the error. Possible errors include the chat not being found or the user not being a member or the client not being authorized or validation errors.

- **Success:**

  If the operation is successful, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `true`.

- **Emit (In Case of Success):**

  After successfully changing the photo, a `chat:changePhoto` event will be emitted to all of the chat members, containing information about the new photo.

## EVENT: `chat:leave`

Leave the chat.

### Request

- **Data Object:**

  - `chatId` (MongoDB ObjectId) - The ObjectId of the chat to leave.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `false`.
  - `error` (string) - A description of the error. Possible errors include the chat not being found or the user not being a member.

- **Success:**

  If the operation is successful, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `true`.

- **Emit (In Case of Success):**

  After successfully leaving the chat, a `chat:leave` event will be emitted to all of the chat members, containing information about the leaving user.

# Request APIs

## EVENT: `request:sendPrivate`

Send a private chat request to another user.

### Request

- **Data Object:**

  - `receiverId` (MongoDB ObjectId) - The ObjectId of the user to send the request to.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with an object containing the following fields:

  - `error` (string) - A description of the error. Possible errors include the receiver not being found or the receiver being the same as the sender.

- **Success:**

  If the operation is successful, the callback function will be called with an object containing the following fields:

  - `success` (boolean) - `true`.

- **Emit (In Case of Success):**

  After successfully sending the request, a `request:receive` event will be emitted to the receiver's socket, containing information about the sender and the request.

## EVENT: `request:sendGroup`

Send a group chat request to another user. (Only the creator of the group chat, or admins are authorized)

### Request

- **Data Object:**

  - `receiverId` (MongoDB ObjectId) - The ObjectId of the user to send the request to.
  - `chatId` (MongoDB ObjectId) - The ObjectId of the chat to send the request to.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with the following fields:

  - `error` (string) - A description of the error. Possible errors include the receiver not being found or the receiver being the same as the sender or the client not being authorized.

- **Success:**

  If the operation is successful, the callback function will be called with the following fields:

  - `success` (boolean) - `true`.

- **Emit (In Case of Success):**

  After successfully sending the request, a `request:receive` event will be emitted to the receiver's socket, containing information about the sender and the request.

## EVENT: `request:sendJoin`

Send a join request to a group chat.

### Request

- **Data Object:**

  - `chatId` (MongoDB ObjectId) - The ObjectId of the chat to send the request to.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with the following fields:

  - `error` (string) - A description of the error. Possible errors include the chat not being found or the user already being a member of the chat.

- **Success:**

  If the operation is successful, the callback function will be called with the following fields:

  - `success` (boolean) - `true`.

- **Emit (In Case of Success):**

  After successfully sending the request, a `request:receive` event will be emitted to the chat's socket, containing information about the sender and the request.

## EVENT: `request:accept`

Accept a request. (In case of join requests, only the creator of the group and the admins are authorized)

### Request

- **Data Object:**

  - `requestId` (MongoDB ObjectId) - The ObjectId of the request to accept.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with the following fields:

  - `error` (string) - A description of the error. Possible errors include the request not being found or the client not being authorized.

- **Success:**

  If the operation is successful, the callback function will be called with the following fields:

  - `success` (boolean) - `true`.

  `In the case of group requests or join requests, info about the chat will be sent with the callback or emitted to the accepted user's socket. In the case of private chat requests, info about the sender and the created private chat will be sent to the both users' sockets.`

- **Emit (In Case of Success):**

  After successfully accepting the request, a `request:accept` event will be emitted to the sender's socket, containing information about the accepted request. In the case of group chat requests, a `chat:join` event will be emitted to the chat's socket, containing information about the accepted user.

## EVENT: `request:decline`

Decline a request. (In case of join requests, only the creator of the group and the admins are authorized)

### Request

- **Data Object:**

  - `requestId` (MongoDB ObjectId) - The ObjectId of the request to decline.

- **Callback:**

  A callback function that takes one parameter.

### Response

- **Failure:**

  If the operation fails, the callback function will be called with the following fields:

  - `error` (string) - A description of the error. Possible errors include the request not being found or the client not being authorized.

- **Success:**

  If the operation is successful, the callback function will be called with the following fields:

  - `success` (boolean) - `true`.

- **Emit (In Case of Success):**

  After successfully declining the request, a `request:decline` event will be emitted to the sender's socket, containing information about the declined request. In the case of declined group request, no event will be emitted.
