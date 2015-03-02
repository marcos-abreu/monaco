( function ( window, _ ) {
  "use strict";

  var Mixin = function ( mixin ) {
    // Resulting mixin that will apply the additional functions
    // Usage: app.mixins.MyMixin( class );
    var result = function ( desinationClass ) {

      _.forIn( mixin, function ( val, key ) {
        //Get the original if it exists, otherwise set to no-op.
        var original = desinationClass.prototype[ key ] || function () {};

        // Mixin property is a function
        if ( typeof val === 'function' ) {
          desinationClass.prototype[ key ] = function () {
            var self = this,
              args = Array.prototype.slice.call( arguments ); // So we can modify arguments

            // Create the 'next' function & inject into last arguments position.
            args[ val.length - 1 ] = function () { return original.apply( self, arguments ); };
            return val.apply( this, args );
          };

          // Mixin is an object and the object already exists
        } else if ( typeof val === 'object' && typeof original === 'object' ) {
          _.extend( desinationClass.prototype[ key ], mixin[ key ] );

          // Mixin is a string, int, bool, or doesn't already exist.
        } else if ( typeof val === 'object' ) {
          desinationClass.prototype[ key ] = _.cloneDeep( mixin[ key ] );

          // Mixin is a string, int, bool, or doesn't already exist.
        } else {
          desinationClass.prototype[ key ] = mixin[ key ];
        }
      } );
    };

    //Exposes the mixin functions
    result.mixinFunctions = mixin || {};

    // Allows Monaco to add the mixins to the appropriate application object
    result.prototype.namespace = 'mixins';
    result.namespace = 'mixins';

    return result;
  };

  // Mixin factory
  Mixin.create = function ( mixin ) {
    return new Mixin( mixin );
  };

  // Expose Mixin on monaco
  Monaco.Mixin = Mixin;

  // Creates the mixins object on monaco application
  Monaco.Application.prototype.mixins = {};

  // Applies several mixins at once
  // Usage: app.mixin(class, 'mixin1', 'mixin2', ..., 'mixinN');
  Monaco.Application.prototype.mixin = function ( desinationClass ) {
    var index;

    // Loop through the supplied mixins
    for ( index = 1; index < arguments.length; index++ ) {
      if ( !this.mixins[ arguments[ index ] ] ) {
        throw new Error( 'Unable to find mixin: ' + arguments[ index ] );
      }
      this.mixins[ arguments[ index ] ]( desinationClass );
    }
  };
}( window, _ ) );
