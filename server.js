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
var moment = require("moment");


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
    db.Article.find({}, null, { sort: { created: -1 } }, function(err, data) {
        if (data.length === 0) {
            res.render("placeholder", { message: "There's nothing scraped yet. Please click \"Scrape New Article\" for new news." });
        } else {
            res.render("index", { articles: data });
        }
    });
});

app.get("/scraped", function(req, res) {
    // var numberOfScrapedArticles;
    request("https://www.azcentral.com/", function(error, response, html) {
        var $ = cheerio.load(html);
        var today = moment().format("YYYY-MM-DD");

        $("a.js-asset-link").each(function(i, element) {
            // if (i < 20) {
            // numberOfScrapedArticles = i;
            var result = {};
            var link = $(this).attr("href");
            var title = $(this).children("span.js-asset-headline").text().trim().replace("\n", "");

            if (link && title) {
                result.link = link;
                result.title = title;
                dateScraped = today;
                //Create a new Article using the `result` object built from scraping
                db.Article
                    .create(result)
                    .then(function(dbArticle) {
                        console.log(dbArticle);
                    })
                    .catch(function(err) {
                        console.log(err.message);
                    });
            }
            // }
        });
        res.send("Scraped Competed");
    });
});

// Route for getting all Articles from the db
app.get("/saved", function(req, res) {
    db.Article.find({}).then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
    //Will sort the articles by most recent (-1 = descending order)
    // .sort({ _id: -1 });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/saved/:id", function(req, res) {
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
app.post("/saved/:id", function(req, res) {
    db.Article.create(req.body)
        .then(function(dbNote) {
            return db.Article
                .findOneAndUpdate({
                    _id: req.params.id
                }, {
                    note: dbNote._id
                }, {
                    new: true
                });
        })
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

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

// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});