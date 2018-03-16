$(document).ready(function() {
    $(".scrapeButton").on("click", function(event) {
        $.ajax("/scraped")
            .done(function(data) {
                document.write(data);
            });
    });

    $(".saveArticleButton").on("click", function(event) {

        $.ajax({
            type: "POST",
            url: "article",
            data: {
                title: $(".titleInput").val(),
                link: $(".linkInput").val(),
            },
            dataType: 'json'
        });
    });
});