$(document).ready(function() {
    $(".scrapeButton").on("click", function(event) {
        $.ajax("/scraped")
            .done(function(data) {
                var template = Handlebars.compile($("#scrapeArticle-template").html());
                $("#list").html(template(data));
            });
    });

});