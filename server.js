// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongojs = require("mongojs");
var mongoose = require("mongoose");
var logger = require("morgan");
var methodOverride = require("method-override");

// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");

// Initialize Express
var app = express();

// Requiring our models for syncing
var db = require("./models");

var PORT = 3000;

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

app.use(methodOverride("_method"));

// Set Handlebars.
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

var MONGODB_URI =
    process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
    //useMongoClient: true
});

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("./public"));

// Routes
app.get("/", function(req, res) {
    res.sendFile(__dirname + "/main.html");
});

// Route for getting all Saved Articles from the db
app.get("/saved", function(req, res) {
    db.Article.find({})
        .then(function(data) {
            res.render("saved", { articles: data });
        }).catch(function(err) {
            res.send(err);
        });
});

// route for scraping new articles
app.get("/scraped", function(req, res) {
    request("https://www.azcentral.com/", function(error, response, html) {
        var $ = cheerio.load(html);
        var scrapedArticles = [];
        $("a.js-asset-link").each(function(i, element) {
            var results = {};
            var link = $(this).attr("href");
            var title = $(this).children("span.js-asset-headline").text().trim().replace("\n", "");

            if (link && title) {
                results.link = "https://www.azcentral.com/" + link;
                results.title = title;
                scrapedArticles.push(results);
            }
        });
        res.json({ articles: scrapedArticles });
    });
});

// route to save an article 
app.post("/article", function(req, res) {
    db.Article.create(req.body)
        .then(function(data) {
            res.send(data);
        }).catch(function(err) {
            res.send(err);
        });
});


// Route for saving a new Note to the db and associating it with an Article
app.post("/note", function(req, res) {
    db.Note.create({ text: req.body.text })
        .then(function(dbNote) {
            db.Article.findOneAndUpdate(req.body.articleId, { $push: { "notes": dbNote._id } }, { new: true })
                .then(function(dbArticle) {
                    res.send(dbArticle);
                });
        })
        .catch(function(err) {
            res.send(err);
        });
});

// delete route to delete a note
app.delete("/note/:id", function(req, res) {
    db.Note.remove({ _id: req.params.id })
        .then(function(dbNote) {
            res.send(dbNote);
        }).catch(function(err) {
            res.send(err);
        });
});

//delete route for articles on the saved page
app.delete("/article/:id", function(req, res) {
    db.Article.remove({ _id: req.params.id })
        .then(function(data) {
            res.send(data);
        })
        .catch(function(err) {
            res.send(err);
        });
});


// to be used for my modal from saved.handlebars #myModal 
// for the Saved Articles link
// Route for retrieving all Notes from the db
app.get("/notes", function(req, res) {
    // Find all Notes
    db.Note.find({})
        .then(function(dbNote) {
            // If all Notes are successfully found, send them back to the client
            res.json(dbNote);
        })
        .catch(function(err) {
            // If an error occurs, send the error back to the client
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate("notes")
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});





// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});