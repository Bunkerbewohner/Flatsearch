
/****** GLOBALS ********/

var db = [];

function get_database_path() {
    if (window.localStorage.getItem("database_path") == null) {
        var path = window.prompt("Enter database file path in your Dropbox");
        window.localStorage.setItem("database_path", path);
    }

    return window.localStorage.getItem("database_path");
}

function update_entry($entry, item) {
    $entry.find('.address').html(item.address);
    $entry.find('.rent').html(item.rent_eur);
    $entry.find('.area').html(item.area_sqm);
    $entry.find('.rooms').html(item.rooms);
    $entry.find('.kaution').html(item.kaution);
    $entry.find('.contact').html(item.contact);
    $entry.find('.termin').val(item.termin);
}

function create_entry(item) {
    var $tr = $("<tr><td><a class=\"url\" href=\"" + item.url + "\"><span class=\"glyphicon glyphicon-link\"></span>" +
        "</a></td><td class=\"address\">...</td>" +
        '<td><span class="rent"></span><br><span class="kaution"></span></td>' +
        '<td><span class="area"></span><br><span class="rooms"></span></td>' +
        '<td><span class="contact"></span></td>' +
        '<td><input class="termin" type="text" onchange="save_termin(this)" placeholder="Termin" data-url="' + item.url + '"></td>' +
        "<td><span class=\"label label-default\">Unknown</span></td></tr>");

    update_entry($tr, item);

    return $tr;
}

function db_get_flat(url) {
    for (var i=0;i<db.length;i++) {
        if (db[i].url == url) {
            return db[i];
        }
    }

    return null;
}

function save_termin(input) {
    var $input = $(input);
    var termin = $input.val();
    var flat = db_get_flat($input.data('url'));
    flat.termin = termin;
    save_database();
}

function set_label($label, status, msg) {
    $label.removeClass("label-default");
    $label.removeClass("label-success");
    $label.removeClass("label-primary");
    $label.removeClass("label-warning");
    $label.removeClass("label-danger");
    $label.removeClass("label-info");

    $label.addClass("label-"+status);

    if (typeof msg != "undefined") {
        $label.html(msg);
    }
}

function refresh_flats() {
    function update($entry, index) {
        return function(updated) {
            update_entry($entry, updated);
            db[index] = updated;
            set_label($entry.find(".label"), "success", "online");

            if (index == db.length - 1) {
                var changed = false;
                for (var i=0;i<db.length;i++) changed |= db[i].changed;
                if (changed) save_database();
            }
        };
    }

    for (var i=0;i<db.length;i++) {
        var flat = db[i];

        // look for table row
        var $tr = $("tr a[href='" + flat.url + "']").parents("tr");

        set_label($tr.find(".label"), "info", "Refreshing...");
        start_crawler(flat, update($tr, i));
    }

    return false;
}

function db_add(item) {
    var $flats = $("#flats").find("tbody");

    $flats.append(create_entry(item));
    db.push(item);
    save_database();
}

function get_crawler(url) {
    var crawler = null;

    if (url.indexOf("immobilienscout24.de") > 0) {
        crawler = immoscout24_crawler;
    }

    return crawler;
}

function start_crawler(inst, cb) {
    url = inst.url;
    var crawler = get_crawler(url);

    if (crawler == null) {
        status_update("Invalid or unsupported URL", "danger");
        return false;
    }

    var proxy_url = "http://localhost:8000/cgi-bin/proxy.py?url=" + encodeURIComponent(url);

    $.get(proxy_url, function(data) {
        crawler(inst, data, cb);
    });

    return true;
}

function add_url() {
    var $url = $("#url");
    var url = $url.val();

    if (!start_crawler(url, db_add)) {
        return false;
    }

    $url.val('');
    status_update("Ready.", "success");
    return false;
}

function status_update(msg, type) {
    if (typeof type == "undefined") type = "info";

    var $label = $("#status .label");
    set_label($label, type);

    $label.text(msg);
}

function success(msg) {
    status_update(msg, "success");
}

function error(msg) {
    status_update(msg, "danger");
}

function info(msg) {
    status_update(msg, "info");
}

/****** DROPBOX ********/
var dropbox_api_key = "1bd7aczoiw4nion";
var dropbox_oauth_receiver = "http://localhost:8000/oauth_receiver.html";

var dropbox = new Dropbox.Client({ key: dropbox_api_key });
dropbox.authDriver(new Dropbox.AuthDriver.Popup({
    receiverUrl: dropbox_oauth_receiver}));

function dropbox_auth(on_success) {
    status_update("Connecting to Dropbox...", "info");

    dropbox.authenticate(function(error, client) {
        if (error) {
            status_update("Could not connect to Dropbox", "error");
            console.log(error);
            return;
        }

        on_success();
    });
}

function load_database(name) {
    if (typeof name == "undefined") name = get_database_path();
    status_update("Loading Database...");
    dropbox.readFile(name, function(error, data) {
        if (error) {
            if (error.status == 404 || error.status == 0) {
                // new / empty database
                status_update("Ready.", "success");
                return;
            }

            status_update(error.response.error, "error");
            console.log(error);
            return;
        }

        db = JSON.parse(data);
        status_update("Ready.", "success");

        var $flats = $("#flats").find("tbody");

        for (var i=0;i<db.length;i++) {
            $flats.append(create_entry(db[i]));
        }

        refresh_flats();
    });
}

function save_database(name) {
    if (typeof name == "undefined") name = get_database_path();

    var data = JSON.stringify(db);
    console.log("saving database...");
    status_update('Saving Database...', 'info');

    dropbox.writeFile(name, data, function(error, stat) {
        if (error) {
            console.log(error);
            status_update(error.response.error);
            return;
        }

        status_update("Database was saved.", "success");
    });
}

function init() {
    status_update("Connected.", "success");
    load_database(get_database_path());
}

// automatically connect at the beginning
$(function() {
    dropbox_auth(init);
});