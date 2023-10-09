// Firebase.js

const firebase = require('firebase/app');

const config = {
    apiKey: "AIzaSyAdntIDQFvF0kgD8Y2cnLQJMwHq92WqtI4",
    authDomain: "chat-pdf-26609.firebaseapp.com",
    projectId: "chat-pdf-26609",
    storageBucket: "chat-pdf-26609.appspot.com",
    messagingSenderId: "650754768316",
    appId: "1:650754768316:web:5d7225fa2175452027ffb9",
    measurementId: "G-0CQZSPETY2"
};

const firebaseApp = firebase.initializeApp(config);

module.exports = firebaseApp;