// $(document).ready(function() {
//     $(".scrapeButton").on("click", function(event) {
//         // event.preventDefault();

//         $.getJSON("/scraped", function(data) {
//             for (var i = 0; i < data.length; i++) {
//                 $(".scrapedArticles").append("<p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "</p>");
//             }
//         });
//     });

//     $(".delete-button").on("click", function(event) {
//         e.preventDefault();
//         var currentURL = location.href + "/" + $(this).data("comment");
//         $.ajax({ method: "DELETE", url: currentURL });
//         location.reload();
//     });

// });