$(document).ready(function() {
    var deleteArticleId;
    var deleteNoteId;
    var articleId;
    var hasNotes;

    function noteHtmlString(note) {
        var noteString;
        if (note) {
            noteString = '<div class="note' + note._id + '">' +
                "<span>" + note.text + "</span>" +
                '<button class="deleteNoteButton" data-id="' + note._id + '">' +
                '<span class="glyphicon glyphicon-remove" />' +
                "</button>" +
                "</div>";
        }
        return noteString;
    }

    $(".addNoteButton").on("click", function(event) {
        articleId = $(this).attr("data-articleId");
        $(".noteContainer").empty();
        $.ajax("/articles/" + articleId).done(function(data) {
            hasNotes = data.notes.length > 0;
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
            if (hasNotes) {
                $(".noteContainer").append(noteHtmlString(data));
                hasNotes = true;
            } else {
                $(".noteContainer").html(noteHtmlString(data));
            }
            $(".deleteNoteButton").on("click", function(event) {
                deleteNoteId = $(this).attr("data-id");
                $.ajax({
                    type: "DELETE",
                    url: "/note/" + deleteNoteId,
                    dataType: "json"
                }).done(function(data) {
                    $(".note" + deleteNoteId).remove();
                });
            });
        });
    });

    $(".deleteArticleButton").on("click", function(event) {
        deleteArticleId = $(this).attr("data-articleId");
        $.ajax({
            type: "DELETE",
            url: "/article/" + deleteArticleId,
            dataType: "json"
        }).done(function(data) {
            $(".row" + deleteArticleId).remove();
        });
    });
});