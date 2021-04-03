/* eslint-disable promise/always-return */
// List of dependencies used in the code
const functions = require('firebase-functions');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const bodyParser = require("body-parser");

// The Firebase Admin SDK to access Cloud Firestore.
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// Module handling on csv file and file system
const csv = require('csv-parser');
const fs = require('fs');

// Module working on file uploads
const formidable = require("formidable");

var hbs = require('handlebars');
var engines = require('consolidate');

const path = require('path');

// Initialize firebase application
var serviceAccount = require('./service_account.json');
const { firebase } = require('firebase-functions-helper');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://sadao-f4a1e.firebaseio.com"
});

const app = express();
const csrfMiddleware = csrf({cookie: true});

app.engine('hbs', engines.handlebars);
app.set('views', "./views");
app.set('view engine', 'hbs');


app.use(cors({ origin: true }));
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(csrfMiddleware);
let token;

app.all("*", (req, res, next) => {
    token = req.csrfToken();
    res.cookie("XSRF-TOKEN", token);
    res.locals._csrf = token;
    next();
});

const db = admin.database();

const SAMPLES = "samples";
const raw_sample_db = admin.firestore();
const rawSampleDB = raw_sample_db.collection(SAMPLES);


// API handling Authentication , Login, Logout
app.get('/login', async(req, res) => {
    // const snapshot = await rawSampleDB.get();
    // snapshot.forEach((doc) => {
    //     console.log(doc.id, '=>', doc.data());
    // });
    res.render('login', {csrfToken: token});
});

app.get('/signup', async(req, res) => {
    res.render('registration');
});

app.post("/sessionLogin", (req, res) => {
    const idToken = req.body.idToken;
    const csrfToken = req.body.csrfToken;
    let csrfToken_session = token;
    console.log("csrfToken: " + csrfToken);
    console.log("session csrf: " + csrfToken_session);

    const expiresIn = 60 * 60 * 24 * 5 * 1000;

    // eslint-disable-next-line promise/catch-or-return
    admin.auth().createSessionCookie(idToken, {expiresIn}).then(
        (sessionCookie) => {
            const options = { maxAge: expiresIn, httpOnly: true};
            res.cookie("session", sessionCookie, options);
            res.end(JSON.stringify({status:"success"}));
        },
        (error) => {
            res.status(401).send("UNAUTHORISED REQUEST");
        }
    );
});

// Handle Logout
app.get('/logout', (req, res) =>  {
    res.clearCookie("session");
    res.redirect('/login');
})

// API handling heatmap page
app.get('/', async (req, res) => {
    // res.render('heatmap');

    verifySession(req,res,"heatmap");
    
});

// API handling administration on each samples
app.get('/samples', async (req,res) => {
    // res.render('admin', {csrfToken: token});
    
    verifySession(req,res,"admin");
});


// Update the sample information corresponding to input attrs
app.put('/samples/:sampleId', (req, res) => {
    const sampleId = req.params.sampleId;
    let sampleRef = db.ref('sampling_data/' + sampleId);
    sampleRef.update(req.body);

    console.log("sample " + sampleId + " has been edited");
    res.send(req.body);
    res.render("admin");
});

// Insert new sample to the database
app.post("/samples", (req, res) => {
    let body = req.body;
    let sampleId = (body.sampleId).replace(/[&/\\#,+()$~%.'":*?<>{}]/g,'_');
    console.log("sampleId: "  + sampleId);
    let sampleRef = db.ref('sampling_data/'+ sampleId);
    sampleRef.set({
        "Ca": parseFloat(body.Ca),
        "EC": parseFloat(body.EC), 
        // "K": parseFloat(body.K) ,
        "NO3": parseFloat(body.NO3),
        "collectedDate": body.collectedDate,
        "latitude": parseFloat(body.latitude),
        "location": body.location,
        "longitude":parseFloat(body.longitude),
        "pH": parseFloat(body.pH),
    });

    console.log("Data has been saved");

    console.log(req.body);
    res.render('admin');
});

//  Delete the sample
app.delete('/samples/:sampleId', (req, res) => {
    const sampleId = req.params.sampleId;
    let sampleRef = db.ref('sampling_data/' + sampleId);
    sampleRef.remove();
    res.render("admin");
});

// API for handling raw samples (has not been measured yet)
app.get('/samples/raw', (req, res) => {
    res.render('sampleRaw',  {csrfToken: token});
});

// Insert new sample to the database
app.post("/samples/raw", (req, res) => {
    let body = req.body;
    let sampleId = (body.sampleId).replace(/[&/\\#,+()$~%.'":*?<>{}]/g,'_');
    let sampleRef = db.ref('sampling_data/'+ sampleId);
    sampleRef.set({
        "Ca": parseFloat(body.Ca),
        "EC": parseFloat(body.EC), 
        "K": parseFloat(body.K) ,
        "NO3": parseFloat(body.NO3),
        "collectedDate": body.collectedDate,
        "latitude": parseFloat(body.latitude),
        "location": body.field,
        "longitude":parseFloat(body.longitude),
        "pH": parseFloat(body.pH),
    });

    console.log("Data has been saved");

    console.log(req.body);
    res.render('sampleRaw');
});

//  Delete the sample
app.delete('/samples/raw/:sampleId', (req, res) => {
    const sampleId = req.params.sampleId;
    let sampleRef = rawSampleDB.where("sampleName","==", sampleId);
    // eslint-disable-next-line promise/catch-or-return
    sampleRef.get().then(function(querySnapshot){
        querySnapshot.forEach((doc) => {
            doc.ref.delete();
        });
    });
    res.render("sampleRaw");
});



// API for handling uploading file data to database
app.get('/heatmap/upload', (req, res) => {
    res.render('heatmapFile', {csrfToken: token});
});

app.post('/heatmap/upload', (req, res) => {
    res.render('heatmapFile');
});

// API for handling parameters
app.get('/settings', (req, res) => {
    // res.render('settings', {csrfToken: token});
    
    verifySession(req,res,"settings");
});

app.put('/settings/:parameterName', (req,res) => {
    const paramName = req.params.parameterName;
    let paramRef = db.ref('parameters/' + paramName);
    paramRef.update({
        min: req.body.min,
        max: req.body.max
    });
    res.send(req.body);
    res.render("settings");
});

// Get Min Max from specified parameter
app.get('/parameters/:parameterName', (req,res) =>{
    const paramName = req.params.parameterName;
    let paramRef = db.ref('parameters/' + paramName);
    res.send(paramRef.once('value'));
});

// API endpoint for retrieving zone in Sadao to be rendered on heatmap
exports.app = functions.https.onRequest(app);

exports.zoningMap = functions.https.onRequest((request, response) => {
    var zoning_coordinates = [];
    response.set('Access-Control-Allow-Origin', '*');
    fs.createReadStream('./sadao_zone.csv').pipe(csv())
    .on('data', (data) => 
    zoning_coordinates.push(data))
    .on('end', () => {response.send(zoning_coordinates);});

});

// Helper function verify session Cookie
function verifySession(req, res, view){
    let sessionCookie = req.cookies.session || "";

    admin.auth()
    .verifySessionCookie(sessionCookie, true)
    .then(() => {
        res.render(view, {csrfToken: token});
    })
    .catch((error) => {
       res.redirect("/login");
    });
}





