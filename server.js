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

mongoose.Promise = Promise;
mongoose.connect(
    "mongodb://localhost/mongoHeadlinesdb", {
        // useMongoClient: true
    }
);

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("./public"));

// Routes
app.get("/", function(req, res) {
    db.Article.find({ saved: false }, null, { sort: { created: -1 } }, function(err, data) {
        if (data.length === 0) {
            res.render("placeholder", { message: "There's nothing scraped yet. Please click \"Scrape New Article\" for new news." });
        } else {
            res.render("index", { articles: data });
        }
    });
});

// Route for getting all Saved Articles from the db
app.get("/saved", function(req, res) {
    db.Article.find({ saved: true }).populate("notes", "body").exec(function(err, data) {
        if (err) {
            console.log(err);
        } else {
            // res.json(dbArticle);
            res.render("saved", { saved: data });
        }
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
        res.render("index", { articles: scrapedArticles });
    });
});


// route to save an article 
app.post("/saved/:id", function(req, res) {
    db.Article.update({ _id: req.params.id }, { $set: { saved: true } }, function(err, data) {
        if (err) {
            res.send(err);
        } else {
            res.redirect("/");
        }
    });
});


// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
    db.Article.findOne({ _id: req.params.id })
        .populate("note")
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

//delete route for articles on the saved page
app.post("/delete/:id", function(req, res) {
    db.Article.update({ _id: req.params.id }, { $set: { saved: false } }, function(err, doc) {
        if (err) {
            res.send(err);
        } else {
            res.redirect("/saved");
        }
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


app.delete("/saved/notes/:id", function(req, res) {
    db.findByIdAndRemove(req.params.id, function(error, doc) {
        // Log any errors
        if (error) {
            console.log(error);
        } else {
            console.log(doc);
            dbArticle.findOneAndUpdate({
                    _id: req.params.id
                }, {
                    $pull: {
                        comment: doc._id
                    }
                })
                // Execute the above query
                .exec(function(err, doc) {
                    // Log any errors
                    if (err) {
                        console.log(err);
                    }
                });
        }
    });
});

// delete route to delete a note
app.post("/saved/delete/:id", function(req, res) {
    db.Note.remove({ _id: req.params.id }, function(err, doc) {
        if (err) {
            res.send(err);
        } else {
            res.redirect("/saved");
        }
    });
});


// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});