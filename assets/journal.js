// Generated by CoffeeScript 1.12.2
(function() {
  var EntryStore, actions, common, entry_store, initialize, main, mount_entries, view,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  common = window.Common;

  entry_store = false;

  initialize = function() {
    console.log('Journal: initializing');
    if (typeof html5 !== "undefined" && html5 !== null) {
      html5.addElements('entries entry tag-cloud');
    }
    initialize = function() {
      return false;
    };
    return true;
  };

  mount_entries = function(root) {
    return console.log("Appending entries to", root);
  };

  view = function(datestr) {
    var date;
    date = moment(datestr, 'YYYY-MM');
    document.title = (date.format('MMM YYYY')) + " / journal";
    $("#habits-link").attr("href", "/habits#view/" + (date.format('YYYY-MM')) + "/0");
    return $.get("/journal/entries/date?date=" + datestr, function(entries) {
      $("#content").html("<entries/>");
      console.log("View date", entries);
      return riot.mount('entries', {
        title: date.format('MMM YYYY'),
        date: date,
        entries: entries
      });
    });
  };

  actions = {
    view: view,
    wiki_index: function() {
      return $.get("/journal/entries/wiki-index", function(entries) {
        $("#content").html("<wiki-entries/>");
        return riot.mount('wiki-entries', {
          entries: entries
        });
      });
    },
    wiki: function(name) {
      return $.get("/journal/entries/name/" + name, function(entry) {
        $("#content").html("<entry-single/>");
        return riot.mount('entry-single', {
          entry_array: [entry]
        });
      });
    },
    tag: function(name) {
      return $.get("/journal/entries/tag/" + name, function(entries) {
        $("#content").html("<entries/>");
        console.log("View tag " + name);
        return riot.mount('entries', {
          title: name,
          entries: entries,
          thunk: mount_entries
        });
      });
    },
    tags: function() {
      return $.get("/journal/tags", function(results) {
        var font_max, font_min, i, len, max, min, r;
        window.results = results;
        max = results.reduce(function(x, y) {
          if (x.Count) {
            return x.Count;
          }
          return Math.max(x, y.Count);
        });
        min = results.reduce(function(x, y) {
          if (x.Count) {
            return x.Count;
          }
          return Math.min(x, y.Count);
        });
        font_min = 12;
        font_max = 24;
        for (i = 0, len = results.length; i < len; i++) {
          r = results[i];
          if (r.Count === min) {
            r.Size = font_min;
          } else {
            r.Size = Math.round((r.Count / max) * (font_max - font_min) + font_min);
          }
        }
        $("#content").html("<tag-cloud/>");
        return riot.mount('tag-cloud', {
          tags: results
        });
      });
    },
    no_action: function() {
      return riot.route("view/" + (moment().format('YYYY-MM')));
    }
  };

  EntryStore = (function(superClass) {
    extend(EntryStore, superClass);

    function EntryStore() {
      return EntryStore.__super__.constructor.apply(this, arguments);
    }

    EntryStore.prototype.on_journal_update = function(entry) {
      return common.request({
        url: "/journal/update",
        success: function(data) {
          return true;
        },
        data: entry
      });
    };

    EntryStore.prototype.on_add_tag = function(entry_id, tag) {
      return $.post({
        url: "/journal/add-tag/" + entry_id + "/" + tag
      });
    };

    EntryStore.prototype.on_remove_tag = function(entry_id, tag) {
      return $.post({
        url: "/journal/remove-tag/" + entry_id + "/" + tag
      });
    };

    EntryStore.prototype.on_delete_entry = function(id) {
      return $.post({
        url: "/journal/delete-entry/" + id,
        success: function() {
          console.log("Success", id);
          return $("#entry-" + id).remove();
        }
      });
    };

    EntryStore.prototype.on_name_entry = function(id, name) {
      console.log(id, name);
      return $.post({
        url: "/journal/name-entry/" + id + "/" + name,
        success: function() {
          return true;
        }
      });
    };

    EntryStore.prototype.on_promote_entry = function(id, name) {
      console.log(id, name);
      return $.post({
        url: "/journal/promote-entry/" + id,
        success: function() {
          return $("#entry-" + id).remove();
        }
      });
    };

    EntryStore.prototype.on_browse_tag = function(name) {
      return riot.route("tag/" + name);
    };

    return EntryStore;

  })(common.Store);

  main = function() {
    var socket;
    initialize();
    entry_store = new EntryStore;
    RiotControl.addStore(entry_store);
    $("#journal-new-entry-date").datepicker({
      onSelect: function(datestr) {
        var date;
        date = moment(datestr, "MM/DD/YYYY").format('YYYY-MM-DD');
        return $.post("/journal/new?date=" + date, function() {
          return view(moment(date, 'YYYY-MM-DD').format('YYYY-MM'));
        });
      }
    });
    common.route("/journal#", "view/" + (moment().format('YYYY-MM')), actions);
    return socket = window.Common.make_socket("journal/sync", function(entry) {
      if ($("#entry-" + entry.ID).length) {
        return RiotControl.trigger("journal-updated", entry);
      }
    });
  };

  window.Journal = {
    initialize: initialize,
    main: main,
    entry_store: entry_store
  };

}).call(this);

//# sourceMappingURL=journal.js.map
