/*
 * Creates the Experiments monaco class, used to work with application experiments
 * ps: by default `Monaco.Experiments` uses Google Analytics to log experiment events
 *     to integrate it with other platforms check the docs.
 */

// make sure monaco is defined as the main object
var Monaco = this.Monaco = (this.Monaco || {});

// Transition Application setup
Monaco.on('app:built', function(app, options) {
  app.experiments = new Monaco.Experiments(options.experiments);
});

/* -- MAIN OBJECT ------------------------------------------------------ */
// Experiments Constructor
var Experiments = Monaco.Experiments = function(options) {
  options = options || {};
  this._experiments = []; // internal list of experiments

  // merge the default options with the custom options received
  this.options = _.extend({
    ga : {slot : 1, scope: 2},
    cookie : {prefix: 'ab-', days: 360, baseDomain: false }
  }, options);
};

Experiments.prototype = _.extend(Experiments.prototype, {
  // remove the experiment reference from the internal list
  // _removeReference: function(experiment) {
  //     var index = this._experiments.indexOf(experiment);
  //     if (index >= 0) {
  //         this._experiments.splice(index, 1);
  //     }
  // },

  // returns an experiment object based on a key search
  get: function(key) {
    return _.find(this._experiments, function(experiment) {
      return experiment.key === key;
    });
  },

  // set an experiment object in the internal list of experiments
  set: function(key, groups, options) {
    var experiment = key;
    if ( !(experiment instanceof Monaco.Experiment) ) {
      experiment = new Monaco.Experiment(this, key, groups, _.extend({}, this.options, options));
    }
    this._experiments.push(experiment);
  },

  // remove all split tests
  // remove: function() {
  //     _.each(this._experiments, function(experiment) {
  //         experiment.remove();
  //     });
  // },

  // opt-out the current user from all experiments
  optout: function() {
    _.each(this._experiments, function(experiment) {
      experiment.optout();
    });
  },

  // split all active experiments
  split: function() {
    _.each(this._experiments, function(experiment, index) {
      experiment.split();
    });
  }
});

/* -- Individual Experiment Object ------------------------------------------- */
var Experiment = Monaco.Experiment = function(parent, key, groups, options) {
  // Every experiment needs a key
  if ( !key ) {
    throw new Error('Monaco :: failed to create the experiment: ' + key + ' - experiment key required' );
  }
  groups = groups || {};
  options = options || {};
  options.users = options.users || 0;
  // the percentage of users to participate on the experiment should be between 0 and 1
  if ( !_.isNumber( options.users ) || options.users > 1 || options.users < 0 ) {
    throw new Error('Monaco :: failed processing experiment: \'' + key + '\' - users not defined within allowed range' );
  }
  // since the variations will be chosen evenly you can't have more variations than
  // the percentage number of users participating in the experiment
  this.usersPerGroup = Math.floor( ( options.users * 100 ) / _.size( groups ) );
  if ( this.usersPerGroup < 1 ) {
    throw new Error('Monaco :: failed processing experiment: \'' + key + '\' - individual groups set to less than 1%' );
  }
  this.parent = parent;
  this.key = key;
  this.groups = groups;
  this.normalized = this._normalizeGroup( groups );
  // this.cookiePrefix = options.cookie.prefix || 'ab-';
  this.options = options;
  this.cookie = {
    set : Monaco.utils.setCookie,
    get : Monaco.utils.getCookie
  };
};

// normalize groups based on the percentage set for each group
Experiment.prototype = _.extend(Experiment.prototype, {
  // original group key used when the user is not assigned to any variation
  original: '__original__',

  // keep track of the current variation this user is assigned to after splitting this experiment
  current: null,

  // split this experiment returning the group this user has been set for this experiment
  split: function() {
    if (!this.current) {
      var cookieOpt = this.options.cookie,
          groupKey = this.cookie.get(cookieOpt.prefix + this.key);
      if(!groupKey) {
        groupKey = this.normalized[Math.floor( Math.random() * this.normalized.length )];
        this.cookie.set(cookieOpt.prefix + this.key, groupKey, cookieOpt.days, cookieOpt.baseDomain);
        this.saveGroup(groupKey);
      }
      // this.current = groupKey === this.original ? groupKey : this.groups[groupKey];
      this.current = groupKey;
    }

    return this.current;
  },

  // return the value of a variation based on its key
  // if no key is provided and the split was already done
  // this method will return the value of the chosen group
  get: function(key) {
    if (!key && this.current) {
      return this.groups[this.current];
    } else if ( !key ) {
      return void 0;
    }
    return this.groups[key];
  },

  // helper method that will return the name of the controller based on this experiment variation
  controller: function(methodName) {
    return !this.current || this.current === this.original ? methodName : methodName + this.get(this.current).suffix;
  },

  // helper method that will return the class name for the view based on this experiment variation
  view: function(ViewClass) {
    return !this.current || this.current === this.original ? ViewClass : ViewClass + this.get(this.current).suffix;
  },

  // helper method that will return the class name for the template based on this experiment variation
  template: function(template) {
    return !this.current || this.current === this.original ? template : template + '.' + this.get(this.current).suffix;
  },

  // remove this experiment
  // remove: function() {
  //     var cookieOpt = this.options.cookie;
  //     this.current = null;
  //     this.cookie.set(cookieOpt.prefix + this.key, '', -1, cookieOpt.baseDomain);
  //     this.parent._removeReference(this);
  // },

  // optout the current user from a specific experiment, basically setting the cookie
  // to the `this.original` property value value
  optout: function() {
    var cookieOpt = this.options.cookie;
    this.cookie.set(cookieOpt.prefix + this.key, this.original, cookieOpt.days, cookieOpt.baseDomain);
  },

  // saves the experiment data, when a user joins one variation of the experiment
  // override this method if you want to use another service other than Google Analytics
  saveGroup: function(groupKey) {
    _gaq.push(['_setCustomVar', this.options.ga.slot, this.key, groupKey, this.options.ga.scope]);
    _gaq.push(['_trackEvent', 'experiments', 'join', (this.key + '|' + groupKey)]);
  },

  toJSON: function() {
    return {
      current: this.current,
      group: this.get(),
      groups: this.groups
    };
  },

  // returns an array of 100 items based on the probability of each group
  _normalizeGroup: function(groups) {
    var normalized = [],
        count = 0;
    for (var groupKey in groups) {
      if (groups.hasOwnProperty(groupKey)) {
        for (var i=0, j=this.usersPerGroup; i < j; i++) {
          normalized.push(groupKey);
          count++;
        }
      }
    }

    var remaining = 100 - count;
    while (--remaining >=0) {
      normalized.push(this.original);
    }
    return normalized;
  }
});
