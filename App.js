Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    launch: function() {
        this.add({
			xtype: 'component',
			cls: 'title',
			html: 'Multi Release Ranking',
			padding: '0, 0, 10, 0'
        });
    }
});
