(function(window) {

    var Monaco = window.Monaco = (window.Monaco || {}),
        utils = Monaco.utils = Monaco.utils || {};

    var dd = utils.DeviceDetection = function(ua) {
        if ( ua == void 0 ) {
            ua = navigator.userAgent;
        }
        this.ua = ua;

        this.is = {
            mobile : Boolean( ua.match( /Mobile/ ) ),
            iPhone : Boolean( ua.match( /iPhone/ ) ),
            iPod : Boolean( ua.match( /iPod/ ) ),
            android : Boolean( ua.match( /Android/ ) ),
            blackBerry : Boolean( ua.match( /BlackBerry/ ) ),
            palmDevice : Boolean( ua.match( /(PalmOS|PalmSource| Pre\/)/ ) ),
            smartMobileHints : Boolean( ua.match( /(smartphone|IEMobile)/ ) ),
            iPad : Boolean( ua.match( /iPad/ ) ),
            androidTablet : Boolean( ua.match( /(GT-P1000|SGH-T849|SHW-M180S)/ ) ),
            tabletPC : Boolean( ua.match( /Tablet PC/ ) ),
            playBook : Boolean( ua.match( /PlayBook/ ) ),
            kindle : Boolean( ua.match( /(Kindle)/ ) )
        };

        this.is.ios = this.is.iPhone || this.is.iPod || this.is.iPad;
    };

    dd.prototype = {
        isSmartPhoneLike : function() {
            return ( this.is.iPhone || this.is.iPod || ( this.is.android && this.is.mobile ) || this.is.blackBerry || this.is.palmDevice || this.is.smartMobileHints ) && !this.isTablet();
        },

        isTablet : function() {
            return this.is.iPad || this.is.tabletPC || this.is.playBook || this.is.androidTablet || this.is.kindle;
        },

        isTouchDevice : function() {
            return this.isTablet() || this.isSmartPhoneLike();
        },

        isDesktop : function() {
            return !this.isTouchDevice();
        },

        androidVersion : function() {
            var re = null,
                result = null;
            if ( this.is.android ) {
                re = /Android (\d+(?:\.\d+)+)/gi;
                result = re.exec( this.ua );
                if ( result.length == 2 ) {
                    return result[1];
                }
            }
            return result;
        }
    };
}( window ) );
