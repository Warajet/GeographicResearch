// -------------------------------------------------------------------------------- //
// ----------------------------------- login.js ----------------------------------- //
// -------------------------------------------------------------------------------- //

// login.js file used to handle all the operations required in login.html 

// Helper function used to get the cookie from Session cookies
function getCookie(name) {
    const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? v[2] : null;
}
// Set the authentication persistence to None
// firebase.auth.Auth.Persistence.NONE : Indicates that the state will only be stored in memory and 
// will be cleared when the window or activity is refreshed.
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);

// Function used to validate the correct format of the user email for sign in
function checkUserSIEmail() {
    var userSIEmail = document.getElementById("userSIEmail");
    var userSIEmailFormate = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var flag;
    if (userSIEmail.value.match(userSIEmailFormate)) {
        flag = false;
    } else {
        flag = true;
    }
    if (flag) {
        document.getElementById("userSIEmailError").style.display = "block";
    } else {
        document.getElementById("userSIEmailError").style.display = "none";
    }
}

// Function used to validate the correct format of the user password for sign in
function checkUserSIPassword() {
    var userSIPassword = document.getElementById("userSIPassword");
    var userSIPasswordFormate = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{10,}/;
    var flag;
    if (userSIPassword.value.match(userSIPasswordFormate)) {
        flag = false;
    } else {
        flag = true;
    }
    if (flag) {
        document.getElementById("userSIPasswordError").style.display = "block";
    } else {
        document.getElementById("userSIPasswordError").style.display = "none";
    }
}
// Function used for sign-in
function signIn() {
    var userSIEmail = document.getElementById("userSIEmail").value;
    var userSIPassword = document.getElementById("userSIPassword").value;
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    var userSIEmailFormate = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var userSIPasswordFormate = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{10,}/;

    var checkUserEmailValid = userSIEmail.match(userSIEmailFormate);
    var checkUserPasswordValid = userSIPassword.match(userSIPasswordFormate);

    if (checkUserEmailValid == null) {
        return checkUserSIEmail();
    } else if (checkUserPasswordValid == null) {
        return checkUserSIPassword();
    } else {
        // When the user signs in with email and password.
        firebase.auth().signInWithEmailAndPassword(userSIEmail, userSIPassword).then(({ user }) => {
            // Get the user's ID token as it is needed to exchange for a session cookie.
            return user.getIdToken().then(idToken => {
                // Session login endpoint is queried and the session cookie is set.
                // CSRF protection should be taken into account.
                // ...
                return sendToken(idToken);
            });
        }).then(() => {
            window.location.assign('/');
        }).catch((error) => {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            Swal.fire({
                type: 'error',
                title: errorCode,
                text: errorMessage,
            })
        });
        return false;
    }
}

// Helper function used to send Token to server to verify session cookies
function sendToken(idToken) {
    console.log("Posting " + idToken);
    var xhr = new XMLHttpRequest();
    var params = `token=${idToken}`;
    xhr.open('POST', "/sessionLogin", true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    return new Promise(function(resolve, reject) {
        xhr.onreadystatechange = function() { //Call a function when the state changes.
            if (xhr.readyState == 4 && xhr.status == 200) {
                resolve();
            } else if (xhr.readyState == 4 && xhr.status != 200) {
                reject("Invalid http return status");
            }
        }
        return xhr.send(params);
    });
}

// Function to keep track on Authentication State Change
firebase.auth().onAuthStateChanged(firebaseUser => {
    if (firebaseUser) {
        console.log("FirebaseUser Login successful");
        console.log(firebaseUser);
    } else {
        console.log("Not Logged in");
    }
});

// Code from previous sprint -> can be used as reference

// loginForm.addEventListener("submit", (event) => {
//     event.preventDefault();
//     const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
//     const login = event.target.username.value;
//     const password = event.target.password.value;

//     // eslint-disable-next-line promise/catch-or-return
//     firebase
//     .auth()
//     .signInWithEmailAndPassword(login, password)
//     .then(({ user }) => {
//         // eslint-disable-next-line promise/no-nesting
//         return user.getIdToken().then((idToken) => {
//           return fetch('/sessionLogin', {
//             method:'POST',
//             headers: {
//               "Content-Type": "application/json;charset=utf-8",
//               "CSRF-Token": csrfToken,
//             },
//             body: JSON.stringify({ idToken , csrfToken}),
//           });
//         });
//     })
//       .then(() => {
//         return firebase.auth().signOut();
//       })
//       // eslint-disable-next-line promise/always-return
//       .then(() => {
//         window.location.assign("/");
//       })
//       .catch((error) => {
//         // eslint-disable-next-line no-alert
//         alert(error.message);
//       });
//     return false;
// });


// When the user signs in with email and password.
// firebase.auth().signInWithEmailAndPassword(userSIEmail, userSIPassword).then(({ user }) => {
//     // Get the user's ID token as it is needed to exchange for a session cookie.
//     return user.getIdToken().then(idToken => {
//         // Session login endpoint is queried and the session cookie is set.
//         // CSRF protection should be taken into account.
//         // ...
//         return sendToken(idToken);
//     });
//     // }).then(() => {
//     //   // A page redirect would suffice as the persistence is set to NONE.
//     //   return firebase.auth().signOut();
// }).then(() => {
//     window.location.assign('/');
// }).catch((error) => {
//     // Handle Errors here.
//     var errorCode = error.code;
//     var errorMessage = error.message;
//     Swal.fire({
//         type: 'error',
//         title: errorCode,
//         text: errorMessage,
//     })
// });

// firebase.auth().signInWithEmailAndPassword(userSIEmail, userSIPassword).then(function(user) {
//   // Get the user's ID token as it is needed to exchange for a session cookie.
//   firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
//   // Session login endpoint is queried and the session cookie is set.
//   // CSRF protection should be taken into account.
//   // ...
//     return sendToken(idToken);
//   });

//   // return fetch('/sessionLogin', {
//   //           method:'POST',
//   //           headers: {
//   //             "Content-Type": "application/json;charset=utf-8",
//   //             "CSRF-Token": csrfToken,
//   //           },
//   //           body: JSON.stringify({ idToken , csrfToken}),
//   //         });
// }).then(() => {
//   window.location.assign('/');
// })
//   .catch((error) => {
//     var errorCode = error.code;
//     var errorMessage = error.message;
//     alert(errorMessage);  
// });

//   firebase.auth().signInWithEmailAndPassword(userSIEmail, userSIPassword).then(({user}) => {
//     return user.getIdToken().then((idToken) => {
//       return fetch('/sessionLogin', {
//         method:'POST',
//         headers: {
//           "Content-Type": "application/json;charset=utf-8",
//           "CSRF-Token": csrfToken,
//         },
//         body: JSON.stringify({ idToken , csrfToken}),
//       });
//     });
// }).then(() => {
//   window.location.assign("/");
// })
//   .then(() => {
//     return firebase.auth().signOut();
//   })
//   // eslint-disable-next-line promise/always-return
//       // Swal.fire({
//       //     type: 'successfull',
//       //     title: 'Succesfully signed in', 
//       // }).then((value) => {
//       //     setTimeout(function(){
//       //         window.location.assign("/");
//       //     }, 1000)
//       // });
//   .catch((error) => {
//       // Handle Errors here.
//       var errorCode = error.code;
//       var errorMessage = error.message;
//       Swal.fire({
//           type: 'error',
//           title: errorCode,
//           text: errorMessage,
//       })
//   });
//   return false;
// }
// }