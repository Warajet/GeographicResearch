let loginForm = document.getElementById("login");

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
    const login = event.target.username.value;
    const password = event.target.password.value;

    // eslint-disable-next-line promise/catch-or-return
    firebase
    .auth()
    .signInWithEmailAndPassword(login, password)
    .then(({ user }) => {
        // eslint-disable-next-line promise/no-nesting
        return user.getIdToken().then((idToken) => {
          return fetch('/sessionLogin', {
            method:'POST',
            headers: {
              "Content-Type": "application/json;charset=utf-8",
              "CSRF-Token": csrfToken,
            },
            body: JSON.stringify({ idToken , csrfToken}),
          });
        });
    })
      .then(() => {
        return firebase.auth().signOut();
      })
      // eslint-disable-next-line promise/always-return
      .then(() => {
        window.location.assign("/");
      })
      .catch((error) => {
        // eslint-disable-next-line no-alert
        alert(error.message);
      });
    return false;
});


firebase.auth().onAuthStateChanged(firebaseUser => {
  if(firebaseUser){
    console.log(firebaseUser);
  }
  else{
    console.log("Not Logged in");
  }
});
