/* CRAWLER for flat infos */

function Flat(url) {
    this.url = url;
    this.address = "";
    this.area_sqm = 0;
    this.rent_eur = 0;
    this.rooms = 0;
    this.kaution = 0;
    this.provision = 0;
    this.type = "";
    this.floor = 0;
    this.has_basement = false;
    this.has_kitchen = false;
    this.has_balcony = false;
    this.description = "";
    this.contact = "";
    this.distances = [];
    this.termin = "";

    return this;
}

/**
 * Takes a URL to a immoscout24 listing and returns the parsed data.
 * @param inst existing instance of a flat to fill
 * @param data the HTML of the page
 * @param cb callback to pass result to
 */
function immoscout24_crawler(inst, data, cb) {
    var flat = new Flat(inst.url);
    var $dom = $(data);

    flat.address = find_address();
    flat.rent_eur = find_price();
    flat.area_sqm = find_area();
    flat.rooms = find_rooms();
    flat.kaution = find_kaution();
    flat.contact = find_contact();

    flat.termin = inst.termin;

    flat.changed = flat.address != inst.address ||
                   flat.rent_eur != inst.rent_eur ||
                   flat.area_sqm != inst.area_sqm ||
                   flat.rooms != inst.rooms ||
                   flat.kaution != inst.kaution ||
                   flat.contact != inst.contact;

    cb(flat, $dom);

    function find_contact() {
        var $realtor = $dom.find(".is24-ex-realtor-s");
        var phone = $realtor.find(".is24-phone").text().match(/(\d[ \-\d]+)/);
        if (phone == null) phone = ['No telephone'];
        phone = phone[0];
        var name = $realtor.find('h3').text().trim();

        return name + "<br>" + phone;
    }

    function find_kaution() {
        return $dom.find(".is24qa-kaution-oder-genossenschaftsanteile").text().trim();
    }

    function find_rooms() {
        return $dom.find(".is24qa-zimmer").text().trim().match(/\d+[\.,]?\d+/);
    }

    function find_area() {
        return $dom.find(".is24qa-wohnflaeche-ca").text().match(/\d+[\.,]\d+/);
    }

    function find_price() {
        var price = $dom.find(".is24qa-gesamtmiete").text().match(/\d+[\.,]\d+/);
        var hint = $dom.find(".is24qa-gesamtmiete").text().match(/\(.[^\)]+\)/);
        if (hint != null) {
            return price + " <span title=\"" + hint + "\">*</span>";
        } else {
            return price;
        }
    }

    function find_address() {
        var lines = $dom.find(".is24-ex-address p:nth-child(2)").text().trim().split("\n");
        var street = lines[0].trim();
        var rest = lines[4].trim().replace(/,.*/, "");

        return street + "<br>" + rest;
    }
}