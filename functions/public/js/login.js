let loginForm = document.getElementById("login");
function checkUserSIEmail(){
  var userSIEmail = document.getElementById("userSIEmail");
  var userSIEmailFormate = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var flag;
  if(userSIEmail.value.match(userSIEmailFormate)){
      flag = false;
  }else{
      flag = true;
  }
  if(flag){
      document.getElementById("userSIEmailError").style.display = "block";
  }else{
      document.getElementById("userSIEmailError").style.display = "none";
  }
}
// xxxxxxxxxx Sign In Password Validation xxxxxxxxxx
function checkUserSIPassword(){
  var userSIPassword = document.getElementById("userSIPassword");
  var userSIPasswordFormate = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{10,}/;      
  var flag;
  if(userSIPassword.value.match(userSIPasswordFormate)){
      flag = false;
  }else{
      flag = true;
  }    
  if(flag){
      document.getElementById("userSIPasswordError").style.display = "block";
  }else{
      document.getElementById("userSIPasswordError").style.display = "none";
  }
}

function signIn(){
  var userSIEmail = document.getElementById("userSIEmail").value;
  var userSIPassword = document.getElementById("userSIPassword").value;
  var userSIEmailFormate = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  var userSIPasswordFormate = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{10,}/;      

  var checkUserEmailValid = userSIEmail.match(userSIEmailFormate);
  var checkUserPasswordValid = userSIPassword.match(userSIPasswordFormate);

  if(checkUserEmailValid == null){
      return checkUserSIEmail();
  }else if(checkUserPasswordValid == null){
      return checkUserSIPassword();
  }else{
      firebase.auth().signInWithEmailAndPassword(userSIEmail, userSIPassword).then((success) => {
          swal({
              type: 'successfull',
              title: 'Succesfully signed in', 
          }).then((value) => {
              setTimeout(function(){
                  window.location.assign("/");
              }, 1000)
          });
      }).catch((error) => {
          // Handle Errors here.
          var errorCode = error.code;
          var errorMessage = error.message;
          swal({
              type: 'error',
              title: 'Error',
              text: "Error",
          })
      });
  }
}

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


firebase.auth().onAuthStateChanged(firebaseUser => {
  if(firebaseUser){
    console.log("FirebaseUser Login successful");
    console.log(firebaseUser);
  }
  else{
    console.log("Not Logged in");
  }
});
