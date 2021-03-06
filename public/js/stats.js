(function (window, undefined) {
  "use strict";
  var Audience, MusicTrack, Programme;

  /**
   * Audience data structure
   *
   * @typedef {{from: Number, to: Number, platforms: {}}} Platforms is a object of service ID/number pairs
   */
  Audience;

  /**
   * Music track structure
   *
   * @typedef {{title: String, artist: String}}
   */
  MusicTrack;

  /**
   * Programme data structure
   *
   * @typedef {{title: String, id: String, subtitle: String, service_id: String, start: String, end: String}}
   */
  Programme;

  /**
   * A Statistic Object Datastructure.
   * Basically, every AJAX/Websocket response returns objects fitting this structure.
   *
   * It represents a bit of time for a broadcaster: what's on air etc.
   * The structure is made to be compactable: an array of 20 Stats objects or a Stats objects summing 20 other ones.
   *
   * @api
   * @constructor
   */
  var Stats = function Stats() {
    /**
     * Channel Identifier
     * @type {string}
     */
    this.channel = "";

    /**
     * Channel human readable name
     * @type {string}
     */
    this.channel_name = "";

    /**
     * List of tracks played during this time interval
     * @type {Array.<MusicTrack>}
     */
    this.tracks = [];

    /**
     * Broadcasted programme during this time interval
     * @type {Programme}
     */
    this.programme = null;

    /**
     * The datetime this information has been *generated*
     * @type {String} A datetime expressed in the ISO-8601 format
     */
    this.timestamp = (new Date()).toISOString(); // prevails d3 to crash if no timestamp is provided

    /**
     * Current audience, its trend and the repartition by broadcasting platform
     * @type {Audience}
     */
    this.audience = {
      total: 0,
      change: 0,
      platforms: {}
    };

    /**
     * Flux of people entering/leaving from other broadcasting services
     * from/to contains services ID as key, and a numeric value corresponding to the flux.
     * For example, `this.flux.from.bbc_one` would indicate how many people arrived on `this.channel` from BBC One.
     * @type {{from: {}, to: {}}}
     */
    this.flux = {
      from: {},
      to: {}
    };

    /**
     * Social data trends
     * @type {{twitter: number}}
     */
    this.social = {
      twitter: 0
    };
  };

  /**
   * Returns the active programme of this interval (the latest one)
   *
   * @api
   * @returns {Programme}
   */
  Stats.prototype.getProgramme = function getProgramme() {
    var now = new Date();

    if (this.programme && this.programme.start) {
      this.programme.startDate = new Date(this.programme.start);
    }

    if (this.programme && this.programme.end) {
      this.programme.endDate = new Date(this.programme.end);
    }

    return this.programme || {
      title: "No title available",
      id: "dummyid",
      subtitle: "",
      service_id: this.channel,
      start: now.setMinutes(-60) && now.toISOString(),
      end: now.setMinutes(180) && now.toISOString()
    };
  };

  Stats.prototype.getTrack = function getTrack() {
    return _latest(this.tracks) || {
      title: "No track information available",
      artist: "No artist information available"
    };
  };

  Stats.prototype.getAudienceChange = function getAudienceChange() {
    return this.audience.change / this.audience.total;
  };

  Stats.prototype.getSignedAudienceChange = function getSignedAudienceChange() {
    if (!this.audience.change) {
      return '-';
    }

    return this.audience.change > 0 ? '+' + this.audience.change : this.audience.change;
  };

  /**
   * Clones an object (single dimension)
   *
   * @param {Object} original
   * @param {Object=} copy
   * @returns {Object}
   * @private
   */
  function _clone(original, copy) {
    copy = copy || {};

    // New ids
    for (var key in original) {
      if (original.hasOwnProperty(key)) {
        copy[key] = original[key];
      }
    }

    return copy;
  }

  /**
   * Returns the latest element from an array
   *
   * @param {Array} items
   * @returns {*}
   * @private
   */
  function _latest(items) {
    items = items || [];

    return items[items.length - 1] || null;
  }

  /**
   * Provide it an ID, it will try to make something almost looking like a readable label
   *
   * @param {String} service_id
   * @returns {String}
   * @private
   */
  function _humanize(service_id) {
    return service_id
      .replace(/_/g, ' ')
      .replace(/(^| )\w/g, function (m) {
        return m.toUpperCase();
      })
      .replace(/bbc/i, function (m) {
        return m.toUpperCase();
      });
  }

  /**
   * Parse an Ajax request response object and convert it into a Stats object
   *
   * @param {String} stationId
   * @param {Object} json
   * @returns {Stats}
   */
  Stats.parse = function parse(stationId, json) {
    // Extending default values
    var stats = new Stats();
    _clone(json, stats);

    stats.channel = stationId;
    stats.channel_name = _humanize(stats.channel);

    if (stats.audience &&
      stats.audience.platforms &&
      (stats.audience.platforms.desktop + stats.audience.platforms.mobile !== stats.audience.total)) {
      //console.warn("Stats.parse() : recalculating error in total listeners for update id %o. Got %o, should be %o", stats.id, stats.audience.total, (stats.audience.platforms.desktop + stats.audience.platforms.mobile));
    }

    return stats;
  };

  /*
   Exporting to the outerworld
   */
  Stats.humanize = _humanize;
  window.Stats = Stats;

}(window));
