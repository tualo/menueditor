Ext.Loader.setPath('Tualo.menueditor.lazy', './jsmenueditor');

Ext.define('Tualo.routes.MenuEditor',{
    statics: {
        load: async function() {
            return [
                {
                    name: 'menueditor',
                    path: '#menueditor'
                }
            ]
        }
    },  
    url: 'menueditor',
    handler: {
        action: function( ){
            Ext.getApplication().addView('Tualo.menueditor.lazy.Viewport');
        },
        before: function (action) {
            action.resume();
        }
    }
});