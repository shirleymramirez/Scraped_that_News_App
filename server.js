// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var mongojs = require("mongojs");
var mongoose = require("mongoose");
var logger = require("morgan");
// var methodOverride = require("method-override");

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
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// app.use(methodOverride("_method"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("./public"));

mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/scrapedThatNewsdb", {
    // useMongoClient: true
});

app.get("/scrape", function(req, res) {
    request("https://www.azcentral.com/", function(error, response, html) {
        var $ = cheerio.load(html);
        $("a").each(function(i, element) {
            var link = $(element).attr("href");
            var headline = $(element)
                .children("span.js-asset-headline").text().trim().replace("\n", "");
            if (headline && link) {
                db.Article.create({
                        headline: headline,
                        link: link
                    },
                    function(err, inserted) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(inserted);
                        }
                    }
                );
            }
        });
    });
    res.send("Scrape Complete");
});

app.get("/articles", function(req, res) {
    db.Article.find({})
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

// Route for getting all Articles from the db
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

// Route for saving/updating an Article's associated Note
app.post("articles/:id", function(req, res) {
    db.Article.create(req.body)
        .then(function(dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
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