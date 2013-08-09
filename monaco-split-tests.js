(function(window){
    var Monaco = window.Monaco = (window.Monaco || {});

    /* -- UTILITIES -------------------------------------------------------- */
    Monaco.utils = Monaco.utils || {};

    Monaco.utils.setCookie = function( key, value, days, baseDomain ) {
        days = ( days && days >= 0 ) ? days : 365;

        var date = new Date();
        date.setTime( date.getTime() + ( days * 24 * 60 * 60 * 1000 ) );
        var expires = '; expires=' + date.toGMTString();

        value = escape( value );
        var cookieString = key + '=' + value + expires + '; path=/;';
        if ( baseDomain ) {
            var domain = document.domain.split('.');
            domain = '.' + domain[ domain.length - 2 ] + '.' + domain[ domain.length - 1 ];
            cookieString += ' domain=' + domain + ';';
        }
        document.cookie = cookieString;
    };

    Monaco.utils.getCookie = function( key ) {
        var result = null;
        return ( result = new RegExp( '(?:^|; )' + encodeURIComponent( key ) + '=([^;]*)' ).exec( document.cookie ) ) ? result[1] : null;
    };

    /* -- MAIN OBJECT ------------------------------------------------------ */
    // expects a google analytics object and a cookie object ( with getCookie and setCookie methods)
    var ab = Monaco.SplitTests = function(ga) {
        this._tests = [];
        this.ga = ga;
        this.cookieManager = cookie;
    };

    // public interface to get a test object
    ab.prototype.getTest = function(key) {
        return _.find(this._tests, function(test){
            return test.key === key;
        });
    };

    // public interface to set a test object
    ab.prototype.setTest = function(key, groups, options) {
        this._tests.push(new ab.Test(key, groups, options, this.cookieManager));
    };

    // public interface to split the tests
    ab.prototype.split = function() {
        _.each(app.splitTests._tests, function(test, index){
            var slot= (5 - Math.floor(test, index));
            var group = test.getUserGroup(this.ga);
            this.ga.setCustomVar(slot, test.key + '.internal', group.key, 2);
            if(group.sufix) {
                _.each(app.view, function(view, key, list){
                    if(list[key + group.sufix] !== void 0) {
                        list[key] = list[key + group.sufix];
                    }
                }, this);
            }
        }, this);
    };

    /* -- INDIVIDUAL TEST OBJECT ------------------------------------------- */
    ab.Test = function(key, groups, options) {
        if ( !key ) {
            throw new Error( 'Failed to create a split test - no key informed' );
        }
        groups = groups || {};
        options = options || {};
        options.users = options.users || 0;
        if ( !_.isNumber( options.users ) || options.users > 1 || options.users < 0 ) {
            throw new Error( 'Error processing split test: \'' + key + '\' - users not defined withing allowed range' );
        }
        this.usersPerGroup = Math.floor( ( options.users * 100 ) / _.size( groups ) );
        if ( this.usersPerGroup < 1 ) {
            throw new Error( 'Error processing split test: \'' + key + '\' - individual groups set to less than 1%' );
        }
        this.key = key;
        this.groups = groups;
        this.normalized = this._normalizeGroup( groups );
        this.cookiePrefix = options.cookiePrefix || 'ab-';
    };

    // normalize groups based on the percentage set for each group
    ab.Test.prototype._normalizeGroup = function( groups ) {
        var normalized = [],
            count = 0;
        for ( var groupKey in groups ) {
            for ( var i = 0, j = this.usersPerGroup; i < j; i++ ) {
                normalized.push( groupKey );
                count++;
            }
        }
        var remaining = 100 - count;
        while ( --remaining >= 0 ) {
            normalized.push( '__original__' );
        }
        return normalized;
    };

    // public interface to get the user group
    ab.Test.prototype.getUserGroup = function( ga ) {
        if ( !this.userGroupKey ) {
            var groupKey = this.cookie.getCookie( this.cookiePrefix + this.key );
            if ( !groupKey ) {
                groupKey = this.normalized[Math.floor( Math.random() * this.normalized.length )];
                this.cookie.setCookie( this.cookiePrefix + this.key, groupKey );
                ga.trackEvent( 'split-test', 'join', ( this.key + '|' + groupKey ), window.wp.userid );
            }
            this.userGroupKey = groupKey;
        }

        return _.extend( { key : this.userGroupKey }, this.groups[ this.userGroupKey ] );
    };
}(window));
