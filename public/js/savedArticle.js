$(document).ready(function() {
    var deleteId;
    var articleId;

    function noteHtmlString(note) {
        var noteString;
        if (note) {
            noteString = "<span>" + note.text + "</span>" +
                '<button class="deleteNoteButton" data-id="' + note._id + '">' +
                '<span class="glyphicon glyphicon-remove" />' +
                "</button>";
        }
        return noteString;
    }

    $(".addNoteButton").on("click", function(event) {
        articleId = $(this).attr("data-articleId");
        $(".noteContainer").empty();
        $.ajax("/articles/" + articleId).done(function(data) {
            if (data.notes.length > 0) {
                data.notes.forEach(function(noteId) {
                    $.ajax("/note/" + noteId).done(function(data) {
                        var noteString = noteHtmlString(data);
                        if (noteString) {
                            $(".noteContainer").append(noteString);
                        }
                    });
                });
            } else {
                $(".noteContainer").append("<span>No notes for this article yet</span>");
            }
            $(".articleNotesModal").modal("show");
            $(".modal-title").text("Notes for " + articleId);
        });
    });

    $(".saveNoteButton").on("click", function(event) {
        $.ajax({
            type: "POST",
            url: "/note",
            data: {
                text: $(".noteInputTextArea").val(),
                articleId: articleId
            },
            dataType: "json"
        }).done(function(data) {
            $(".noteContainer").append(noteHtmlString(data));
            $(".deleteNoteButton").on("click", function(event) {
                $.ajax({
                    type: "DELETE",
                    url: "/note/" + $(this).attr("data-id"),
                    dataType: "json"
                }).done(function(data) {
                    $(".noteContainer").html("<span>No notes for this article yet</span>");
                });
            });
        });
    });

    $(".deleteArticleButton").on("click", function(event) {
        deleteId = $(this).attr("data-articleId");
        $.ajax({
            type: "DELETE",
            url: "/article/" + deleteId,
            dataType: "json"
        }).done(function(data) {
            $(".row" + deleteId).remove();
        });
    });
});